import React, { useEffect } from 'react'
import "./App.css"

import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps"
import worldMap from '@amcharts/amcharts4-geodata/worldUltra';
import taiwanMap from './twTown1982.geo.json';
import taiwanStoreDataJSON from "./storeData.json"
import testImage from './testImage.jpg'

let chart
export default function App() {

  useEffect(() => {
    setAm4core();

    // 如果兩者地圖同時載入，後者會疊加在前者身上
    // inputWorldMap();
    inputTaiwanMap();
  }, [])

  // 設置 amcharts 的 am4core
  function setAm4core() {
    // 建立指定 id element 生成
    chart = am4core.create(
      "am4mapsChart", // element id
      am4maps.MapChart // 設定生成種類
    );

    // 投影世界地圖，使其'展平'成 二維地圖
    chart.projections = new am4maps.projections.Miller()

    // 將地圖縮放到特定的縮放級別，並以緯度/經度坐標為中心。
    // const geoPoint = { latitude: message.latitude, longitude: message.longitude };
    // chart.zoomToGeoPoint(geoPoint, 12, true, 1000);

    // 設置 縮放地圖的動畫時間 0=關閉
    // chart.zoomDuration = 1000;
    // 開啟 內建按鈕提供放大縮小的功能
    // chart.zoomControl = new am4maps.ZoomControl();
    // chart 有 放大縮小的 function 可提供額外接
    // chart.goHome() / chart.zoomIn() / chart.zoomOut()
  }

  // 世界地圖的載入
  function inputWorldMap() {
    // 建立地圖設定
    let polygonSeries = new am4maps.MapPolygonSeries();
    // 開啟'已加載地圖'的 多邊形數據
    polygonSeries.useGeodata = true;
    // 移除南極大陸
    polygonSeries.exclude = ['AQ'];
    // 限定局部國家地圖載入
    polygonSeries.include = ['TW'];

    // 讓 chart 載入地圖設定
    let worldSeries = chart.series.push(polygonSeries);
    // 加載世界地圖
    worldSeries.geodata = worldMap;
  }

  // 台灣地圖的載入
  function inputTaiwanMap() {
    // 建立地圖設定
    let polygonSeries = new am4maps.MapPolygonSeries();

    // 讓 chart 載入地圖設定
    let taiwanSeries = chart.series.push(polygonSeries);
    // 加載台灣地圖
    taiwanSeries.geodata = taiwanMap;

    // 設定台灣地圖起始中心位置
    chart.homeGeoPoint = {
      latitude: 23.58,
      longitude: 120.58
    };

    setObjectCoordinates(taiwanStoreDataJSON);
  }

  // 設置對象座標
  function setObjectCoordinates(json) {
    // 將此功能加入到 chart
    let imageSeries = chart.series.push(new am4maps.MapImageSeries());
    // 載入對象 經緯度 等等資料
    const stores = json.result.map(data => ({
      latitude: Number(data.address.latitude),
      longitude: Number(data.address.longitude),
      title: data.title,
      fillColor: data.color,
      storeImage: data.openImageBool ? testImage : 'null',
    }));
    imageSeries.data = stores;

    // 建立地圖標示 || hover標示
    let imageSeriesTemplate = imageSeries.mapImages.template;
    // 搭配 stores 綁定 經緯度參數
    imageSeriesTemplate.propertyFields.latitude = 'latitude';
    imageSeriesTemplate.propertyFields.longitude = 'longitude';
    // 設置標示 click 事件
    imageSeriesTemplate.events.on('hit', function (env) {
      // 放大且移動至該標示
      env.target.series.chart.zoomToMapObject(env.target, 5);
    });

    // 設定地圖標示
    let circle = imageSeriesTemplate.createChild(am4core.Circle);
    // 設定 標示樣式
    circle.radius = 3;
    // circle.fill = am4core.color('#d10a28');
    circle.propertyFields.fill = 'fillColor';
    circle.cursorOverStyle = am4core.MouseCursorStyle.pointer;
    // 防止地圖標示放大而放大
    circle.nonScaling = true;
    // 搭配 stores 綁定 hover標示的顯示內容
    circle.tooltipText = '{title}';

    // 設置 circle click 事件
    let circle2 = imageSeriesTemplate.createChild(am4core.Circle);
    let currentCircle // 設置當前選擇的 標示
    circle2.radius = 3;
    circle2.propertyFields.fill = "fillColor";
    // 設置 標示動畫
    function animateBullet(circle) {
      var animation = circle.animate([
        { property: "scale", from: 1, to: 5 },
        { property: "opacity", from: 1, to: 0 }
      ], 1000, am4core.ease.circleOut);
      // 循環動畫
      animation.events.on("animationended", function (event) {
        if (event.target.object.cloneId === currentCircle) animateBullet(event.target.object);
      })
    }
    // 設置行為觸發動畫
    circle2.events.on('hit', function (env) {
      if (env.target.cloneId === currentCircle) return false
      currentCircle = env.target.cloneId
      animateBullet(env.target);
    });

    // 標示 新增圖片
    let img = imageSeriesTemplate.createChild(am4core.Image);
    img.propertyFields.href = 'storeImage';
    img.width = 50;
    img.height = 50;
    img.nonScaling = true;
    // 設立圖片基準點 horizontalCenter:水平 / verticalCenter:垂直
    img.horizontalCenter = "middle";
    img.verticalCenter = "middle";
    img.tooltipHTML = `<img class='testImg' src=${testImage} />`;

    // 標示之間互相牽線
    let lineSeries = chart.series.push(new am4maps.MapLineSeries());
    lineSeries.mapLines.template.strokeWidth = 4;
    lineSeries.mapLines.template.stroke = am4core.color("#1061a6");
    lineSeries.mapLines.template.nonScalingStroke = true;
    lineSeries.mapLines.template.tooltipText = 'line01'
    lineSeries.data = [{
      "multiGeoLine": [
        [
          { "latitude": 22.304642, "longitude": 114.171357 },
          { "latitude": 22.337334, "longitude": 114.174481 },
          { "latitude": 22.379801, "longitude": 114.187662 }
        ]
      ]
    }];
  }

  // 新增 標示座標點
  // function sendMarkPointer() {
  //   return (
  //     <div style={{ dislpay: "flex", marginLeft: "7px" }}>
  //       <input placeholder="緯度" onChange={(e) => {
  //         setInputLatitudeAndLongitude({ ...inputLatitudeAndLongitude, latitude: Number(e.target.value) })
  //       }} />
  //       <input style={{ marginLeft: "7px" }} placeholder="經度" onChange={(e) => {
  //         setInputLatitudeAndLongitude({ ...inputLatitudeAndLongitude, longitude: Number(e.target.value) })
  //       }} />
  //       <button onClick={() => {
  //         // 更新 data
  //         const newData = imageSeries.data.slice()
  //         newData.push(inputLatitudeAndLongitude)
  //         // 覆蓋原本的 data
  //         imageSeries.data = newData
  //       }}>送出</button>
  //     </div>
  //   )
  // }

  // 透過其他 click 事件 去縮放並導引到 標示點
  // 發送點擊的標示座標
  // function handleClick(item) {
  //   const { dsLatitude, dsLongitude } = item.address;
  //   const message = {
  //     message: 'MOVE_TO_BRANCH',
  //     longitude: Number(dsLongitude),
  //     latitude: Number(dsLatitude)
  //   };
  //   window.postMessage(JSON.stringify(message), '*');
  // }
  // // 接收點擊的標示座標
  // function zoomToGeoPoint(env) {
  //   if (
  //     typeof env.data === 'string' &&
  //     JSON.parse(env.data).hasOwnProperty('message') &&
  //     JSON.parse(env.data).message === 'MOVE_TO_BRANCH'
  //   ) {
  //     const message = JSON.parse(env.data);
  //     // get 點擊的 標示點
  //     const geoPoint = { latitude: message.latitude, longitude: message.longitude };
  //     // 移動到點擊的 標示點，並放大且導引
  //     chart.zoomToGeoPoint(geoPoint, 12, true, 1000);
  //     // 顯示點擊 的標示座標
  //     setDisplayLatitudeAndLongitude({ latitude: message.latitude, longitude: message.longitude })
  //     // 被點擊的標示 加入動畫
  //     const circle2Groups = imageSeriesTemplate.children.values[1].clones.values;
  //     const activeCircle2 = circle2Groups.find(data => data.dataItem.dataContext === message);
  //     // 單次閃爍
  //     activeCircle2.animate(
  //       [
  //         { property: 'scale', from: 1, to: 5 },
  //         { property: 'opacity', from: 1, to: 0 }
  //       ],
  //       1000,
  //       am4core.ease.circleOut
  //     ); 
  //     // 持續閃爍
  //     const animateBullet = circle => {
  //       var animation = circle.animate(
  //         [
  //           { property: 'scale', from: 1, to: 5 },
  //           { property: 'opacity', from: 1, to: 0 }
  //         ],
  //         1000,
  //         am4core.ease.circleOut
  //       );
  //       animation.events.on('animationended', event => {
  //         if (activeCircle2.dataItem.dataContext === this.props.activeBranch) {
  //           animateBullet(event.target.object);
  //         }
  //       });
  //     };
  //     animateBullet(activeCircle2);
  //   }
  // }

  return (
    <div id="am4mapsChart"></div>
  )
}
