import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, FullScreen} from 'ol/control';
import {fromLonLat, transform} from 'ol/proj';
import {Tile as TileLayer} from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import VectorImageLayer from 'ol/layer/VectorImage';
import VectorSource from 'ol/source/Vector';
import {Fill, Stroke, Style, Text, Image, Circle} from 'ol/style';
import XYZ from 'ol/source/XYZ';
import Overlay from 'ol/Overlay';

import axios from 'axios';
import moment from 'moment';

import chroma from 'chroma-js';

import { lastStateChartFn, lastOutcomesChartFn } from './chart-stato'
import { regionDistributionChart } from './chart-regioni'
import { casesDiffusionChart } from './chart-cases'
import { createSlider } from './slider'

const url = "https://covid19-it-api.herokuapp.com";

// Map
var map = new Map({
    target: 'map',
    controls: defaultControls().extend([
        new FullScreen({tipLabel:'Mappa a schermo intero'})
      ]),
    layers: [
        new TileLayer({
            source: new XYZ({
                attributions:'CoViD-19 Data Source &copy; <a href="http://www.protezionecivile.gov.it/" target="_blank">'+
                             'Sito del Dipartimento della Protezione Civile - Presidenza del Consiglio dei Ministri</a>',
                url: 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            })
        })
    ],
    view: new View({
      center: fromLonLat([13.245209,42.304227]),
      zoom: 6
    })
});

// Popup overlay
// Popup showing the position the user clicked
var popup = new Overlay({
    element: document.getElementById('popup')
});
map.addOverlay(popup);

// Regions centroids
var centroidsLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    }),
    style: function(feature) {
        const casi = parseInt(feature.get('numero_casi'));
        var radius;
        if (casi == 0) {
            radius = 0
        } else if(casi >= 1 && casi <= 5){
            radius = 4;
        } else if(casi >= 6 && casi <= 20) {
            radius = 8;
        } else if (casi >= 21 && casi <= 40) {
            radius = 10;
        } else if (casi >= 41 && casi <= 60) {
            radius = 12;
        } else if (casi >= 61 && casi <= 80){
            radius = 15;
        } else if (casi >= 81 && casi <= 100){
            radius = 20;
        } else if (casi >= 101 && casi <= 150){
            radius = 25;
        } else if (casi >= 151 && casi <= 200){
            radius = 30;
        } else if (casi >= 201 && casi <= 250){
            radius = 35;
        } else if (casi >= 251 && casi <= 400){
            radius = 40;
        } else if (casi >= 401 && casi <= 600){
            radius = 45;
        } else if (casi >= 601 && casi <= 800){
            radius = 50;
        } else if (casi >= 801 && casi <= 1000){
            radius = 55;
        } else if (casi >= 1001 && casi <= 1500){
            radius = 60;
        } else if (casi >= 1501 && casi <= 3000){
            radius = 65;
        } else {
            radius = 70;
        }

        return new Style({
            image: new Circle({
                radius: radius,
                fill: new Fill({color: 'rgba(220,53,69,.75)' }),
	            stroke: new Stroke({color: '#dc3545', width: 2})
            })
        })
        
    }
});

// map.addLayer(centroidsLayer);
// centroidsLayer.set("name","Centroidi Regioni");

// Region polygons
var regionsLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    })
});
map.addLayer(regionsLayer)
regionsLayer.set("name","Regioni");
regionsLayer.setOpacity(0.85)

// Mouse move
// ************************************************************
map.on('pointermove', function(e) {
	if (e.dragging) return;
    var pixel = e.map.getEventPixel(e.originalEvent);
    var hit = e.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
    	if (layer){
            var coordinate = e.coordinate;
            popup.setPosition(coordinate);
            document.getElementById('popup-content').innerHTML = "<h5 class='text-danger'>"+feature.getProperties().denominazione_regione+"</h5>"
                                                                + "Tamponi: "+feature.getProperties().tamponi
                                                                + "<br/>Totale casi: "+feature.getProperties().totale_casi
                                                                + "<br/>Positivi: "+feature.getProperties().totale_attualmente_positivi
            return layer.get('name') === 'Centroidi Regioni' || layer.get('name') === 'Regioni';
        }
    });
    if (hit){
        e.map.getTargetElement().style.cursor = 'pointer';
    } else {
        popup.setPosition(undefined);
        e.map.getTargetElement().style.cursor = '';
    }
    // e.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

// Get COVID19 Summary Data
// ************************************************************
axios.get(url+'/andamento',{ params:{} }).then(function(response){
    var totale_casi = response.data[0].totale_casi;
    var aggiornamento = response.data[0].data;
    // Update total count
    document.querySelector("#tot-contagi").innerHTML = totale_casi
    // Update date
    document.querySelector("#data-at").innerHTML = moment(aggiornamento).format('DD MMM YYYY, HH:mm')
    // LastState Chart
    lastStateChartFn(response.data[0])
    // Last Outcomes Chart
    lastOutcomesChartFn(response.data[0])
    // Populate region distribution layer and chart
    regionDistribution(aggiornamento);
    // Trend Chart
    casesDiffusionChart(response.data);
    // Slider - decommentare una volta che saranno stati sistemati i dati dal DPC
    createSlider(response.data)
});

// Get COVID19 Last Distribution Data
// ************************************************************
const regionDistribution = function(aggiornamento){
    axios.get(url+'/regioni/map',{
        params:{
            data: aggiornamento
        }
    }).then(function(response){
        centroidsLayer.getSource().clear()
        // Spatial data
        /*
        var features = response.data.features;
        var reprojected_features = [];
        features.forEach(function(feature){
            var obj = {"type":"Feature","properties":feature.properties, "geometry":{"type":"Point",coordinates:new transform(feature.geometry.coordinates,'EPSG:4326','EPSG:3857')}}
            reprojected_features.push(obj);
        })
        var collection = {"type": "FeatureCollection", "features": reprojected_features};
        var featureCollection = new GeoJSON().readFeatures(collection);
        // Update centroids layer
        centroidsLayer.getSource().addFeatures(featureCollection);
        */
       regionsLayer.getSource().clear()
        // Spatial data
        var features = response.data.features;
        var collection = {"type": "FeatureCollection", "features": features};
        var featureCollection = new GeoJSON({featureProjection:'EPSG:3857'}).readFeatures(collection);
        // Update regions layer
        regionsLayer.getSource().addFeatures(featureCollection);
        // Update regions layer style
        var scale = chroma.scale(['#ffffe0', '#fff2c7', '#ffe5b1', '#ffd79d', '#ffc88e', 
                    '#ffba81', '#ffaa76', '#ff9a6e', '#fc8968', '#f77b63', 
                    '#f16b5f', '#e95d5a', '#e24f55', '#d8414e', '#cd3346', 
                    '#c3263d', '#b61932', '#a90c25', '#9a0316', '#8b0000'
                    ]).domain([0,30,100,200,300,400,500,600,1000,5000,10000]);               
        regionsLayer.getSource().forEachFeature(function (feature) {
            var randomColor = scale(feature.get('totale_casi')).hex(); 
            var randomStyle = new Style({
                stroke: new Stroke({ color: "#FFF", width: 1 }),
                fill: new Fill({ color: randomColor })
            }); // define a style variable
            feature.setStyle(randomStyle); // set feature Style
        });
        // Regional Distribution Chart
        regionDistributionChart(features)
    });
}

    /*
    axios.get(url+'/regioni/map',{
        params:{
            data: '2020-03-11'
        }
    }).then(function(response){
        regionsLayer.getSource().clear()
        // Spatial data
        var features = response.data.features;
        var collection = {"type": "FeatureCollection", "features": features};
        var featureCollection = new GeoJSON({featureProjection:'EPSG:3857'}).readFeatures(collection);
        // Update regions layer
        regionsLayer.getSource().addFeatures(featureCollection);
        // Update regions layer style
        var scale = chroma.scale(['#ffffe0', '#fff2c7', '#ffe5b1', '#ffd79d', '#ffc88e', 
                    '#ffba81', '#ffaa76', '#ff9a6e', '#fc8968', '#f77b63', 
                    '#f16b5f', '#e95d5a', '#e24f55', '#d8414e', '#cd3346', 
                    '#c3263d', '#b61932', '#a90c25', '#9a0316', '#8b0000'
                    ]).domain([0,30,100,200,300,400,500,600,1000,5000,10000]);               
        regionsLayer.getSource().forEachFeature(function (feature) {
            var randomColor = scale(feature.get('totale_casi')).hex(); 
            var randomStyle = new Style({
                stroke: new Stroke({ color: "#FFF", width: 1 }),
                fill: new Fill({ color: randomColor })
            }); // define a style variable
            feature.setStyle(randomStyle); // set feature Style
        });
        // Regional Distribution Chart
        // regionDistributionChart(features)
    });*/


export { regionDistribution }