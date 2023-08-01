const stationsEl = document.getElementById("stations");

stationsEl.addEventListener("click", () => StationsInformation());

// ---- Leaflet 初始化 ----
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
// ---- Leaflet 初始化 ----

// --- 顯示台灣向量輪廓 ---
async function showTaiwanShape() {
  // 取得台灣地形圖資
  const res = await fetch("taiwan.json");
  const data = await res.json();

  // 將 GeoJSON 轉換為 Leaflet 圖層
  const geojsonLayer = L.geoJSON(data).addTo(map);

  // 設定圖層樣式（可自行定義）
  geojsonLayer.setStyle({
    color: "yellow",
    weight: 1,
    Opacity: 0.3,
    fillOpacity: 0,
  });
}

// 觀測站資訊頁面
function StationsInformation() {
  // --- 取得觀測站資訊 ---
  (async function getStations() {
    const res = await fetch(
      "https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=CWB-0AFFC5D1-340B-437D-8E6E-BFEACCCBB52B"
    );
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

    const stationMarkers = L.layerGroup().addTo(map);
    // 在 Leaflet 地圖上創建 Marker Layer，並將每個觀測站作為標記放置
    stations.forEach((station) => {
      const latlng = new L.LatLng(station.lat, station.lon);

      // Create a Leaflet circle marker for each station
      const circleMarker = L.circleMarker(latlng, {
        radius: 4,
        fillColor: "white",
        fillOpacity: 0.7,
        color: "transparent", // 設定邊線顏色為透明色
      }).addTo(stationMarkers);

      // Using the station information, create the popup content
      const popupContent = `
      <p>站名： ${station.locationName}</p>
    `;

      // Bind the popup to the circle marker
      circleMarker.bindPopup(popupContent);

      // Add event listeners to show/hide the popup on hover
      circleMarker.on("mouseover", function () {
        this.openPopup();
      });

      circleMarker.on("mouseout", function () {
        this.closePopup();
      });
    });
  }

  function update() {
    // 更新地理投影（使用新的地圖縮放和平移）
    projection
      .scale((d3.event.transform.k * 256) / (2 * Math.PI))
      .translate([d3.event.transform.x, d3.event.transform.y]);
  }

  // 當地圖進行縮放或平移時調用更新函式
  map.on("zoomend moveend", update);
  update();
}
