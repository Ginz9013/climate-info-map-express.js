// DOM
const switchEl = document.getElementById("switch");
const stationsEl = document.getElementById("stations");
const rainfallEl = document.getElementById("rainfall");
const uviEl = document.getElementById("uvi");

// Listener
switchEl.addEventListener("click", () => {
  console.dir(switchEl.checked);
  if (geojsonLayer) {
    map.removeLayer(geojsonLayer);
    geojsonLayer = null;
  } else {
    showTaiwanShape();
  }
});
stationsEl.addEventListener("click", () => StationsInformation());
rainfallEl.addEventListener("click", () => rainfallPage());
uviEl.addEventListener("click", () => uviInfoPage());

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

// ---- Layer ----
let geojsonLayer = null;
let stationMarkers = null;
let heatmapLayer = null;
let uviMapLayer = null;
// ---- Layer ----

// ---- ClearLayer ----
function clearLayer() {
  if (stationMarkers) {
    map.removeLayer(stationMarkers);
  }

  if (heatmapLayer) {
    map.removeLayer(heatmapLayer);
  }

  if (uviMapLayer) {
    map.removeLayer(uviMapLayer);
  }
}

// --- 顯示台灣向量輪廓 ---
async function showTaiwanShape() {
  // 取得台灣地形圖資
  const res = await fetch("taiwan.json");
  const data = await res.json();
  console.log(data);

  // 將 GeoJSON 轉換為 Leaflet 圖層
  geojsonLayer = L.geoJSON(data).addTo(map);

  // 設定圖層樣式（可自行定義）
  geojsonLayer.setStyle({
    color: "white",
    weight: 0.5,
    Opacity: 0.1,
    fillOpacity: 0,
  });
}

// --- 觀測站資訊頁面 ---
async function StationsInformation() {
  // 清除圖層
  clearLayer();
  console.log(map.getZoom());

  // --- 取得觀測站資訊 ---
  const res = await fetch(
    "https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=CWB-0AFFC5D1-340B-437D-8E6E-BFEACCCBB52B"
  );
  const data = await res.json();

  const stations = data.records.location;

  // 使用 D3 繪製觀測站位置
  drawObservationStations(stations);

  // 創建一個 D3 繪製函式
  function drawObservationStations(stations) {
    // 在地圖上創建 D3 疊加層
    L.svg().addTo(map);

    stationMarkers = L.layerGroup().addTo(map);
    // 在 Leaflet 地圖上創建 Marker Layer，並將每個觀測站作為標記放置
    stations.forEach((station) => {
      const latlng = new L.LatLng(station.lat, station.lon);

      // Create a Leaflet circle marker for each station
      const circleMarker = L.circleMarker(latlng, {
        radius: 5,
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

// --- 降雨資訊頁面 ---
async function rainfallPage() {
  // 清除圖層
  clearLayer();

  // ---- Leaflet-Heatmap.js ----
  const res = await fetch(
    "https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=CWB-0AFFC5D1-340B-437D-8E6E-BFEACCCBB52B&limit=100&parameterName=CITY"
  );
  const data = await res.json();
  const rainfallInfo = data.records.location;
  console.log(rainfallInfo);
  // .then(res => res.json())
  // .then(data => {
  //   console.log(data)
  // })
  // .catch(err => {
  //   console.log(err)
  // })

  // 重組降雨資料
  let infoArr = rainfallInfo.map((location) => ({
    x: location.lon,
    y: location.lat,
    value: location.weatherElement[6].elementValue,
  }));

  // console.log(arr);

  const option = {
    scaleRadius: false,
    radius: 50,
    useLocalExtrema: true,
    latField: "y",
    lngField: "x",
    valueField: "value",
    maxOpacity: 0.5,
  };

  heatmapLayer = new HeatmapOverlay(option);
  console.log(heatmapLayer);

  const testData = {
    max: 100,
    data: infoArr,
  };
  heatmapLayer.setData(testData);

  heatmapLayer.addTo(map);
}

// --- 紫外線資訊頁面 ---
async function uviInfoPage() {
  // 清除圖層
  clearLayer();

  // 取得觀測站資料（靜態）
  const stationsRes = await fetch("stations.json");
  const stations = await stationsRes.json();
  const stationList =
    stations.cwbdata.resources.resource.data.stationsStatus.station;

  console.log(stationList);

  const res = await fetch(
    "https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0005-001?Authorization=CWB-0AFFC5D1-340B-437D-8E6E-BFEACCCBB52B"
  );
  const data = await res.json();
  const uviList = data.records.weatherElement.location;

  console.log(uviList);

  let uviData = {};

  uviList.forEach((item) => {
    stationList.forEach((station) => {
      if (item.locationCode === station.StationID) {
        if (uviData[station.CountyName] !== undefined) {
          uviData[station.CountyName] = +(
            (uviData[station.CountyName] + item.value) /
            2
          ).toFixed(2);
        } else {
          uviData[station.CountyName] = item.value;
        }
      }
    });
  });

  console.log(uviData);

  const geoRes = await fetch("taiwan.json");
  const geoData = await geoRes.json();

  geoData.features.forEach((feature) => {
    const countyName = feature.properties.NAME_2014; // 假設 GeoJSON 中行政區名稱屬性為 'name'
    const uviValue = uviData[countyName];
    if (uviValue !== undefined) {
      feature.properties.uviValue = uviValue;
    }
  });

  uviMapLayer = L.geoJSON(geoData, {
    style: function (feature) {
      // 根據人口數量來設定顏色
      const uvi = feature.properties.uviValue;
      return {
        fillColor: getColorByUvi(uvi), // 使用自訂函式來取得顏色
        weight: 1,
        color: "white",
        fillOpacity: 0.3,
      };
    },
  }).addTo(map);

  function getColorByUvi(uvi) {
    if (uvi < 3) {
      return "green";
    } else if (uvi < 6) {
      return "orange";
    } else if (uvi < 8) {
      return "brown";
    } else if (uvi < 11) {
      return "red";
    } else {
      return "purple";
    }
  }

  console.log(geoData);
}

// ---- 降雨量資訊頁面 ----
// (async function )
