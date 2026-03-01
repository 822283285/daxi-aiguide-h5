/**
 * Mapbox 地图服务
 * @description 封装 Mapbox GL JS 地图操作
 */

import { ConfigService } from "@/core/config/config-service.js";

export class MapService {
  constructor(options = {}) {
    this.map = null;
    this.configService = options.configService || new ConfigService();
    this.options = {
      container: options.container || "map",
      style: options.style || "mapbox://styles/mapbox/light-v10",
      center: options.center || [116.397428, 39.90923],
      zoom: options.zoom || 15,
      minZoom: options.minZoom || 2,
      maxZoom: options.maxZoom || 20,
      pitch: options.pitch || 0,
      bearing: options.bearing || 0,
      ...options,
    };
    this.layers = new Map();
    this.sources = new Map();
    this.markers = [];
  }

  /**
   * 初始化地图
   * @returns {Promise<Map>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      try {
        // 检查 Mapbox GL JS 是否已加载
        if (typeof mapboxgl === "undefined") {
          reject(new Error("Mapbox GL JS not loaded"));
          return;
        }

        this.map = new mapboxgl.Map({
          container: this.options.container,
          style: this.options.style,
          center: this.options.center,
          zoom: this.options.zoom,
          minZoom: this.options.minZoom,
          maxZoom: this.options.maxZoom,
          pitch: this.options.pitch,
          bearing: this.options.bearing,
        });

        this.map.on("load", () => {
          console.log("[MapService] Map loaded");
          resolve(this.map);
        });

        this.map.on("error", (error) => {
          console.error("[MapService] Map error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取地图实例
   * @returns {Map|null}
   */
  getMap() {
    return this.map;
  }

  /**
   * 添加标记
   * @param {Object} options - 标记选项
   * @returns {Marker}
   */
  addMarker(options = {}) {
    const {
      lng,
      lat,
      element,
      color = "#3B82F6",
      scale = 1,
      draggable = false,
      anchor = "center",
    } = options;

    const marker = new mapboxgl.Marker({
      element,
      color,
      scale,
      draggable,
      anchor,
    }).setLngLat([lng, lat]);

    if (options.popup) {
      marker.setPopup(new mapboxgl.Popup(options.popup));
    }

    marker.addTo(this.map);
    this.markers.push(marker);

    return marker;
  }

  /**
   * 移除标记
   * @param {Marker} marker - 标记实例
   */
  removeMarker(marker) {
    marker.remove();
    const index = this.markers.indexOf(marker);
    if (index !== -1) {
      this.markers.splice(index, 1);
    }
  }

  /**
   * 清除所有标记
   */
  clearMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
  }

  /**
   * 添加 GeoJSON 数据源
   * @param {string} id - 数据源 ID
   * @param {Object} data - GeoJSON 数据
   * @param {Object} options - 选项
   */
  addSource(id, data, options = {}) {
    if (this.map.getSource(id)) {
      this.map.removeSource(id);
    }

    this.map.addSource(id, {
      type: "geojson",
      data,
      ...options,
    });

    this.sources.set(id, data);
  }

  /**
   * 移除数据源
   * @param {string} id - 数据源 ID
   */
  removeSource(id) {
    if (this.map.getSource(id)) {
      this.map.removeSource(id);
      this.sources.delete(id);
    }
  }

  /**
   * 添加图层
   * @param {string} id - 图层 ID
   * @param {string} type - 图层类型 (fill, line, circle, symbol)
   * @param {Object} paint - 样式配置
   * @param {Object} layout - 布局配置
   * @param {string} [beforeId] - 插入位置
   */
  addLayer(id, type, paint, layout = {}, beforeId) {
    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
    }

    this.map.addLayer(
      {
        id,
        type,
        source: this.options.sourceId || id,
        paint,
        layout,
      },
      beforeId
    );

    this.layers.set(id, { type, paint, layout });
  }

  /**
   * 移除图层
   * @param {string} id - 图层 ID
   */
  removeLayer(id) {
    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
      this.layers.delete(id);
    }
  }

  /**
   * 清除所有图层
   */
  clearLayers() {
    this.layers.forEach((_, id) => {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    });
    this.layers.clear();
  }

  /**
   * 设置地图中心
   * @param {Array<number>} center - [lng, lat]
   * @param {Object} options - 动画选项
   */
  setCenter(center, options = {}) {
    this.map.easeTo({
      center,
      ...options,
    });
  }

  /**
   * 设置地图缩放
   * @param {number} zoom - 缩放级别
   * @param {Object} options - 动画选项
   */
  setZoom(zoom, options = {}) {
    this.map.easeTo({
      zoom,
      ...options,
    });
  }

  /**
   * 飞行动画到指定位置
   * @param {Object} options - 飞行选项
   */
  flyTo(options = {}) {
    this.map.flyTo({
      center: options.center,
      zoom: options.zoom || 15,
      pitch: options.pitch || 0,
      bearing: options.bearing || 0,
      speed: options.speed || 1.2,
      curve: options.curve || 1.42,
      ...options,
    });
  }

  /**
   * 适配边界框
   * @param {Array<Array<number>>} bounds - [[lng, lat], [lng, lat]]
   * @param {Object} options - 选项
   */
  fitBounds(bounds, options = {}) {
    this.map.fitBounds(bounds, {
      padding: options.padding || 50,
      maxZoom: options.maxZoom || 18,
      ...options,
    });
  }

  /**
   * 获取当前中心点
   * @returns {Array<number>} [lng, lat]
   */
  getCenter() {
    return this.map.getCenter().toArray();
  }

  /**
   * 获取当前缩放级别
   * @returns {number}
   */
  getZoom() {
    return this.map.getZoom();
  }

  /**
   * 获取当前边界
   * @returns {Array<Array<number>>}
   */
  getBounds() {
    const bounds = this.map.getBounds();
    return [
      [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
      [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
    ];
  }

  /**
   * 监听地图事件
   * @param {string} type - 事件类型
   * @param {Function} handler - 处理函数
   */
  on(type, handler) {
    this.map.on(type, handler);
  }

  /**
   * 移除事件监听
   * @param {string} type - 事件类型
   * @param {Function} handler - 处理函数
   */
  off(type, handler) {
    this.map.off(type, handler);
  }

  /**
   * 销毁地图
   */
  destroy() {
    this.clearMarkers();
    this.clearLayers();
    this.sources.forEach((_, id) => this.removeSource(id));

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * 绘制路线
   * @param {Array<Array<number>>} coordinates - 路线坐标 [[lng, lat], ...]
   * @param {Object} options - 样式选项
   */
  drawRoute(coordinates, options = {}) {
    const routeId = `route_${Date.now()}`;

    // 添加数据源
    this.addSource(routeId, {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates,
      },
    });

    // 添加图层
    this.addLayer(
      `${routeId}-line`,
      "line",
      {
        "line-color": options.color || "#3B82F6",
        "line-width": options.width || 4,
        "line-opacity": options.opacity || 0.8,
      },
      {
        "line-cap": "round",
        "line-join": "round",
      }
    );

    return routeId;
  }

  /**
   * 绘制 POI 点
   * @param {Array<Object>} pois - POI 列表
   * @param {Object} options - 样式选项
   */
  drawPOIs(pois, options = {}) {
    const features = pois.map((poi) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          poi.location?.longitude || poi.location?.lng || 0,
          poi.location?.latitude || poi.location?.lat || 0,
        ],
      },
      properties: {
        id: poi.id,
        name: poi.name,
        type: poi.type,
        ...poi.metadata,
      },
    }));

    const poiId = `pois_${Date.now()}`;

    this.addSource(poiId, {
      type: "FeatureCollection",
      features,
    });

    this.addLayer(
      `${poiId}-circle`,
      "circle",
      {
        "circle-radius": options.radius || 8,
        "circle-color": options.color || "#EF4444",
        "circle-opacity": options.opacity || 0.8,
        "circle-stroke-width": options.strokeWidth || 2,
        "circle-stroke-color": options.strokeColor || "#FFFFFF",
      },
      {
        "circle-sort-key": ["get", "sortOrder"],
      }
    );

    return poiId;
  }
}

/**
 * 创建全局地图服务实例
 * @type {MapService}
 */
export const mapService = new MapService();
