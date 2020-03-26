import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, FullScreen} from 'ol/control';
import {fromLonLat, getTransform} from 'ol/proj';
import {applyTransform} from 'ol/extent';
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
import { trendChart } from './chart-trend'
import { newCasesDiffusionChart } from './chart-new-cases'
import { createSlider } from './slider'
import { populateRegionsMenu } from './filters'

const url = "https://covid19-it-api.herokuapp.com";
const ItalyExtent = [3.691406249999991, 35.31736632923787, 22.67578124999999, 47.57652571374621];

// Map
var map = new Map({
    target: 'map',
    controls: defaultControls().extend([
        // new FullScreen({tipLabel:'Mappa a schermo intero'})
      ]),
    layers: [
        new TileLayer({
            source: new XYZ({
                attributions:'CoViD-19 Data Source &copy; <a href="http://www.protezionecivile.gov.it/" target="_blank">'+
                             'Sito del Dipartimento della Protezione Civile - Presidenza del Consiglio dei Ministri</a>',
                url: 'http://{a-c}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'
            })
        })
    ],
    view: new View({
      center: fromLonLat([13.245209,42.304227]),
      zoom: 6
    })
});

// Popup overlay
var popup = new Overlay({
    element: document.getElementById('popup')
});
map.addOverlay(popup);

// Custer labels
var getClusterLabel = function(feature){
	var text = feature.get('totale_casi');
	return text;
};

var clusterStyle = function(feature){

        const casi = parseInt(feature.get('totale_casi'));
        var zoomlevel = map.getView().getZoom()

        var radius;
        var fill = new Fill({color: 'rgba(255,68,68,.75)' });
        var stroke = new Stroke({color: '#FFF', width: 1});
        if (casi == 0) {
            radius = null;
            fill = null;
            stroke = null;
        } else if (casi <= 10){
            radius = 4
        } else if (casi <= 50){
            radius = 6
        } else if (casi >= 51 && casi <=100){
            radius = 8
        } else if (casi >= 101 && casi <=250){
            radius = 10
        } else if (casi >= 251 && casi <= 500){
            radius = 12
        } else if (casi >= 501 && casi <= 1000) {
            radius = 15
        } else if (casi >= 1001 && casi <= 2000) {
            radius = 18
        } else if (casi >= 2001 && casi <= 3500) {
            radius = 20
        } else {
            radius = 25
        }
        
        var cluster = new Style({
            image: new Circle({
                radius: radius * zoomlevel * 0.18,
                fill: fill,
	            stroke: stroke
            })
        });

        var label = new Style({
            text: new Text({
		        textAlign: 'center',
		        textBaseline: 'middle',
		        font: '10px Verdana',
		        overflow:false,
                text: feature.get('totale_casi').toString(),
		        fill: new Fill({color: '#000'}),
		        stroke: new Stroke({color: '#FFF', width: 3})
		     })
        })

        if (zoomlevel > 7){
            return [cluster, label] 
        } else {
            return cluster
        }
	
};

// Provinces centroids
var provincesCentrLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    }),
    style: clusterStyle
});
map.addLayer(provincesCentrLayer);
provincesCentrLayer.set("name","Centroidi Province");
provincesCentrLayer.setZIndex(13)

// Provinces polygons
var provincesLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    })
})
map.addLayer(provincesLayer)
provincesLayer.set("name","Province")
provincesLayer.setZIndex(11)

// Region polygons
var regionsLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    }),
    style: new Style({
        stroke: new Stroke({ color: "#37474F", width: 2 })/*,
        fill: new Fill({ color: "rgba(255,255,255,0.75)" })*/
    })
});
map.addLayer(regionsLayer)
regionsLayer.set("name","Regioni")
regionsLayer.setZIndex(10)

var zoomRegionLayer = new VectorImageLayer({
    source: new VectorSource({
        format:new GeoJSON()
    })
})
map.addLayer(zoomRegionLayer)
zoomRegionLayer.setZIndex(12);

// Mouse move
// ************************************************************
map.on('pointermove', function(e) {
	if (e.dragging) return;
    var pixel = e.map.getEventPixel(e.originalEvent);
    var hit = e.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
    	if (layer){
            var coordinate = e.coordinate;
            popup.setPosition(coordinate);
            var popupContent = document.getElementById('popup-content');
            if (layer.get('name')=='Regioni'){
                popupContent.innerHTML = "<h5 class='text-danger'>"+feature.getProperties().denominazione_regione+"</h5>"
                                            + "Tamponi: "+feature.getProperties().tamponi
                                            + "<br/>Totale casi: "+feature.getProperties().totale_casi
                                            + "<br/>Positivi: "+feature.getProperties().totale_attualmente_positivi
            } else if (layer.get('name')=='Province' || layer.get('name')=='Centroidi Province'){
                popupContent.innerHTML = "<h5 class='text-white'>"+feature.getProperties().denominazione_provincia+": "+feature.getProperties().totale_casi+" casi</h5>"
            }
            return layer.get('name') === 'Centroidi Province' || layer.get('name') === 'Regioni' || layer.get('name') === 'Province';
        }
    });
    if (hit){
        e.map.getTargetElement().style.cursor = 'pointer';
    } else {
        popup.setPosition(undefined);
        e.map.getTargetElement().style.cursor = '';
    }
});

// Get COVID19 Summary Data
// ************************************************************
axios.get(url+'/andamento',{ params:{} }).then(function(response){
    var totale_casi = response.data[0].totale_casi;
    var aggiornamento = response.data[0].data;
    var totale_attualmente_positivi = response.data[0].totale_attualmente_positivi
    var nuovi_attualmente_positivi = response.data[0].nuovi_attualmente_positivi
    // Update total count
    document.querySelector("#tot-contagi").innerHTML = totale_casi
    document.querySelector("#tot-positivi").innerHTML = totale_attualmente_positivi
    document.querySelector("#nuovi-positivi").innerHTML = nuovi_attualmente_positivi
    // Update date
    document.querySelector("#data-at").innerHTML = moment(aggiornamento).format('DD MMM YYYY')
    // LastState Chart
    lastStateChartFn(response.data[0])
    // Last Outcomes Chart
    lastOutcomesChartFn(response.data[0])
    // Populate region distribution layer and chart
    regionDistribution(aggiornamento);
    // Populate region distribution layer
    provincesDistribution(aggiornamento)
    // Trend Chart
    trendChart(response.data);
    // New Cases Chart
    newCasesDiffusionChart(response.data);
    // Slider - decommentare una volta che saranno stati sistemati i dati dal DPC
    createSlider(response.data)
});

// Get COVID19 Last Region Distribution Data
// ************************************************************
const regionDistribution = function(aggiornamento){
    axios.get(url+'/regioni/map',{
        params:{
            data: aggiornamento
        }
    }).then(function(response){
        regionsLayer.getSource().clear()
        // Spatial data
        var features = response.data.features;
        // Calculate color scale domain
        var color_scale_domain = []
        features.forEach(function(e){
            color_scale_domain.push(e.properties.totale_casi)
        })
        var collection = {"type": "FeatureCollection", "features": features};
        var featureCollection = new GeoJSON({featureProjection:'EPSG:3857'}).readFeatures(collection);
        // Update regions layer
        regionsLayer.getSource().addFeatures(featureCollection);
        var scale = chroma.scale('Reds').domain([0,Math.max.apply(Math, color_scale_domain)]);
        regionsLayer.getSource().forEachFeature(function (feature) {
            var regStyle;
            if (feature.get('totale_casi') == 0){
                regStyle = new Style({
                    stroke: new Stroke({ color: "#37474F", width: 1 }),
                    fill: new Fill({ color: '#98a1a6' })
                }); 
            } else {
                var regColor = scale(feature.get('totale_casi')).hex(); 
                regStyle = new Style({
                    stroke: new Stroke({ color: "#37474F", width: 1 }),
                    fill: new Fill({ color: regColor })
                }); 
            }
            feature.setStyle(regStyle); // set feature Style
        })
        // Regional Distribution Chart
        regionDistributionChart(features)
        // Regions filter
        populateRegionsMenu(features)
    });
}

const provincesDistribution = function(aggiornamento){
    // Polygons
    axios.get(url+'/province/map',{
        params:{
            data: aggiornamento
        }
    }).then(function(response){
        provincesLayer.getSource().clear()
        // Spatial data
        var features = response.data.features;
        // Calculate color scale domain
        var color_scale_domain = []
        features.forEach(function(e){
            color_scale_domain.push(e.properties.totale_casi)
        })
        var collection = {"type": "FeatureCollection", "features": features};
        var featureCollection = new GeoJSON({featureProjection:'EPSG:3857'}).readFeatures(collection);
        // Update provinces layer
        provincesLayer.getSource().addFeatures(featureCollection);
        // Update provinces layer style
        /*var scale = chroma.scale([
            '#ffffe0', '#fff2c7', '#ffe5b1', '#ffd79d', '#ffc88e', 
            '#ffba81', '#ffaa76', '#ff9a6e', '#fc8968', '#f77b63', 
            '#f16b5f', '#e95d5a', '#e24f55', '#d8414e', '#cd3346', 
            '#c3263d', '#b61932', '#a90c25', '#9a0316', '#8b0000'
        ]).domain([0,Math.max.apply(Math, color_scale_domain)]); */
        var scale = chroma.scale('Reds').domain([0,Math.max.apply(Math, color_scale_domain)]);
        provincesLayer.getSource().forEachFeature(function (feature) {
            var provStyle;
            if (feature.get('totale_casi') == 0){
                provStyle = new Style({
                    stroke: new Stroke({ color: "#37474F", width: 1 }),
                    fill: new Fill({ color: '#98a1a6' })
                }); 
            } else {
                var provColor = scale(feature.get('totale_casi')).hex(); 
                provStyle = new Style({
                    stroke: new Stroke({ color: "#37474F", width: 1 }),
                    fill: new Fill({ color: provColor })
                }); 
            }
            feature.setStyle(provStyle); // set feature Style
        });
        // Province Distribution Chart - To Do
        // regionDistributionChart(features)
    });
    // Centroids
    axios.get(url+'/province',{
        params:{
            data: aggiornamento
        }
    }).then(function(response){
        provincesCentrLayer.getSource().clear()
        // Spatial data
        var features = response.data.features;
        var collection = {"type": "FeatureCollection", "features": features};
        var featureCollection = new GeoJSON({featureProjection:'EPSG:3857'}).readFeatures(collection);
        // Update centroids layer
        provincesCentrLayer.getSource().addFeatures(featureCollection);
    })
}

const zoomToGeometry = function(reg, aggiornamento){
    // Selection style
    var selStyle = function(){
        var external = new Style({
			stroke: new Stroke({
				color: '#b71c1c',
				width: 8
            }),
			zIndex: 1
		});
		var internal = new Style({
			stroke: new Stroke({
			 	color: '#FFF',
			 	width: 2,
			 	lineCap: 'round'
			}),
		    zIndex: 3
		});
		return [external,internal]
    }

    axios.get(url+'/regioni/map',{ params:{ data: aggiornamento } }).then(function(response){
        // console.log(response)
        zoomRegionLayer.getSource().clear();
        var selected_region_feature = []
        var features = response.data.features;
        features.forEach(feature =>{
            if (feature.properties.codice_regione == reg){
                selected_region_feature.push(feature)
            }
        });
        // console.log(selected_region_feature)
        var collection = {"type": "FeatureCollection", "features": selected_region_feature};
        var featureCollection = new GeoJSON({featureProjection:'EPSG:3857'}).readFeatures(collection);
        zoomRegionLayer.getSource().addFeatures(featureCollection);
        zoomRegionLayer.getSource().getFeatures()[0].setStyle(selStyle)
        var extent = zoomRegionLayer.getSource().getExtent();
        map.getView().fit(extent, map.getSize());
    })
}

const zoomToItaly = function(){
    var boundingExtent = applyTransform(ItalyExtent, getTransform("EPSG:4326", "EPSG:3857"));
    map.getView().fit(boundingExtent, map.getSize());
}

// Layer switcher
const layerBtn = document.querySelector("#layer-btn")
const layerPanel = document.querySelector("#layer-panel")
layerBtn.addEventListener('click',(e)=>{
    // e.preventDefault()
    if (layerPanel.style.visibility == 'hidden'){
        layerPanel.style.visibility = 'visible'
    } else {
        layerPanel.style.visibility = 'hidden'
    }    
});

document.querySelector("#prov-pt-toggler").addEventListener('change',(e)=>{
    if(e.target.checked) {
        provincesCentrLayer.setVisible(true)
    } else {
        provincesCentrLayer.setVisible(false)
    }
})

document.querySelector("#prov-pl-toggler").addEventListener('change',(e)=>{
    if(e.target.checked) {
        provincesLayer.setVisible(true)
    } else {
        provincesLayer.setVisible(false)
    }
})

document.querySelector("#reg-pl-toggler").addEventListener('change',(e)=>{
    if(e.target.checked) {
        regionsLayer.setVisible(true)
    } else {
        regionsLayer.setVisible(false)
    }
})

var legendContainer = document.querySelector('#legend-container')
var legendColors = chroma.brewer.OrRd
legendColors.forEach(color => {
    var legendElement = '<div class="color-step" style="background-color:'+color+'"></div>'
    legendContainer.innerHTML += legendElement
})



export { regionDistribution, provincesDistribution, zoomToGeometry, zoomRegionLayer, zoomToItaly }