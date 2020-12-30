import React, { useEffect } from "react";
import "./App.css";

import { Loader, LoaderOptions } from "google-maps";
// 設置 google map key
const loader = new Loader("AIzaSyDzTmj81wHIQeRK1qldxbVF035wjSiZzIU", {});
let gmap;

export default function App() {
  useEffect(() => {
    // 載入 google map
    loader.load().then((google) => {
      gmap = new google.maps.Map(document.getElementById("googleMap"), {
        center: { lat: 22.304642, lng: 114.171357 },
        zoom: 12,
        scrollwheel: true,
        disableDefaultUI: true,
      });
    });
  }, []);

  // 輸入經緯度 找尋 車程距離/時間
  searchLatitudeAndLongitude = () => {
    const {
      displayLatitudeAndLongitude,
      inputLatitudeAndLongitude,
      imageSeriesData,
    } = this.state;

    if (
      inputLatitudeAndLongitude.latitude !== 0 &&
      inputLatitudeAndLongitude.longitude !== 0
    ) {
      loader.load().then((google) => {
        let matrixService = new google.maps.DistanceMatrixService();
        let originA = new google.maps.LatLng(
          displayLatitudeAndLongitude.latitude,
          displayLatitudeAndLongitude.longitude
        );
        let destinationA = new google.maps.LatLng(
          inputLatitudeAndLongitude.latitude,
          inputLatitudeAndLongitude.longitude
        );

        matrixService.getDistanceMatrix(
          {
            origins: [originA],
            destinations: [destinationA],
            travelMode: "DRIVING",
            avoidHighways: true,
            avoidTolls: true,
          },
          (response, status) => {
            if (status === "OK") {
              // 確定有搜尋 正確地址
              if (response.rows[0].elements[0].status === "OK") {
                // 新增 標示點
                const newData = imageSeriesData.slice();
                newData.push(inputLatitudeAndLongitude);
                imageSeries.data = newData;

                // 新增 標示線
                lineSeries.data = [
                  {
                    multiGeoLine: [
                      [
                        displayLatitudeAndLongitude,
                        {
                          latitude: inputLatitudeAndLongitude.latitude,
                          longitude: inputLatitudeAndLongitude.longitude,
                        },
                      ],
                    ],
                  },
                ];
                lineSeries.mapLines.template.tooltipText =
                  response.rows[0].elements[0].distance.text +
                  " - " +
                  response.rows[0].elements[0].duration.text;
              }
            }
          }
        );
      });
    }
  };

  // 輸入地址 找尋 經緯度
  searchAddress = (address) => {
    const { inputLatitudeAndLongitude } = this.state;

    loader.load().then((google) => {
      const geocoder = new google.maps.Geocoder();

      if (address) {
        geocoder.geocode({ address: address }, (results, status) => {
          if (status === "OK") {
            this.setState({
              inputLatitudeAndLongitude: {
                ...inputLatitudeAndLongitude,
                latitude: results[0].geometry.location.lat(),
                longitude: results[0].geometry.location.lng(),
              },
            });
            this.searchLatitudeAndLongitude();
          }
        });
      }
    });
  };

  // 同步 google Map
  updateMapPosition = () => {
    // 首先載入 google Map
    loader.load().then((google) => {
      gmap = new google.maps.Map(document.getElementById("googleMap"), {
        center: { lat: 22.35056, lng: 114.12222 }, // 選擇 地區中心點
        zoom: 11.15, // 設定縮放等級，來同步 chartMap4 的 geo Map 大小
        scrollwheel: true,
        disableDefaultUI: true,
      });
    });

    // 設定 chart Map 中心點
    chart.homeGeoPoint = {
      latitude: 22.35056,
      longitude: 114.12222,
    };

    // chart 監聽 行為去同步 Map Position
    chart.events.on("zoomlevelchanged", updateMapPosition);
    chart.events.on("mappositionchanged", updateMapPosition);
    chart.events.on("scaleratiochanged", updateMapPosition);

    // 設定 updateMapPosition 同步行為
    function updateMapPosition(ev) {
      if (typeof gmap === "undefined") return;
      // set google map zoom level:

      // 同步 chartMap & googleMap 縮放等級
      function currentChartZoomLevel(chartZoomLevel) {
        switch (chartZoomLevel) {
          case 2:
            return 12;
          case 4:
            return 13;
          case 8:
            return 14;
          case 16:
            return 15;
          case 32:
            return 16;
          default:
            return 11;
        }
      }

      // 同步 googleMap default zoomLevel 的小數點
      const newGoogleMapZoomLevel =
        currentChartZoomLevel(chart.zoomLevel).toString() + ".15";
      // 讓 googleMap zoom level 常駐小數點
      // gmap.setZoom(Number(newGoogleMapZoomLevel));
      gmap.zoom = Number(newGoogleMapZoomLevel);

      // googleMap 同步 chartMap 位置
      gmap.setCenter({
        // a small adjustment needed for this div size:
        lat: chart.zoomGeoPoint.latitude,
        lng: chart.zoomGeoPoint.longitude,
      });
    }
  };

  return (
    <>
      <div id="googleMap"></div>
      <button
        className="add-local-btn"
        style={{ marginLeft: "7px" }}
        onClick={() => {
          this.searchLatitudeAndLongitude();
        }}
      >
        新增座標
      </button>
    </>
  );
}
