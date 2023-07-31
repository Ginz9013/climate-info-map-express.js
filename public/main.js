// Leaflet 初始化
const map = L.map("map").setView([23.6978, 120.9605], 8);

const Stadia_AlidadeSmoothDark = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }
);
Stadia_AlidadeSmoothDark.addTo(map);


// --- 顯示台灣向量輪廓 ---
(async function showTaiwanShape(){
  // 取得台灣地形圖資
  const res = await fetch('taiwan.json');
  const data = await res.json();

  // 將 GeoJSON 轉換為 Leaflet 圖層
  const geojsonLayer = L.geoJSON(data).addTo(map);

  // 設定圖層樣式（可自行定義）
  geojsonLayer.setStyle({
    color: 'yellow',
    weight: 1,
    Opacity: 0.3,
    fillOpacity: 0
  });
})();


(async function getStationsLocation() {
  const res = await fetch("https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=CWB-0AFFC5D1-340B-437D-8E6E-BFEACCCBB52B");
  const data = await res.json();

  const stations = data.records.location;
  console.log(stations);

  // 使用 D3 繪製觀測站位置
  drawObservationStations(stations);
})();

// 創建一個 D3 繪製函式
function drawObservationStations(stations) {
  // 在地圖上創建 D3 疊加層
  L.svg().addTo(map);

  // 定義地理投影（使用經緯度坐標）
  const projection = d3.geoMercator();

  // 定義繪製函式，將經緯度座標投影為像素坐標
  const path = d3.geoPath().projection(d3.geoTransform({ point: (x, y) => projection([x, y]) }));

  // 在 Leaflet 地圖上創建 Marker Layer，並將每個觀測站作為標記放置
  stations.forEach((station) => {
    const latlng = new L.LatLng(station.lat, station.lon);
    const point = map.latLngToLayerPoint(latlng);
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    svg
      .append("circle")
      .attr("cx", point.x)
      .attr("cy", point.y)
      .attr("r", 5)
      .style("fill", "red")
      .style("opacity", 0.7);
  });
}

function update() {
  // 更新地理投影（使用新的地圖縮放和平移）
  // projection
  //   .scale(d3.event.transform.k * 256 / (2 * Math.PI))
  //   .translate([d3.event.transform.x, d3.event.transform.y]);

  // 更新地理路徑產生器（path）的投影函式
  // path.projection(d3.geoTransform({ point: (x, y) => projection([x, y]) }));
  
  // 更新座標點的位置和半徑
  stationCircles
    .attr("cx", (d) => map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x)
    .attr("cy", (d) => map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y)
    .attr("r", 5 / d3.event.transform.k);
}

// 當地圖進行縮放或平移時調用更新函式
map.on('zoomend moveend', update);
update();

