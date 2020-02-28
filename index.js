import '@fortawesome/fontawesome-free/js/all';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import {fromLonLat, transform} from 'ol/proj';
import {Tile as TileLayer} from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorImageLayer from 'ol/layer/VectorImage';
import VectorSource from 'ol/source/Vector';
import {Fill, Stroke, Style, Text, Image, Circle} from 'ol/style';
import XYZ from 'ol/source/XYZ';
import '@turf/centroid';
import 'bootstrap/dist/css/bootstrap.min.css';
import './main.scss'

import axios from 'axios';
import lodash from 'lodash';

import 'chart.js';

import 'nouislider/distribute/nouislider.min.css';
import noUiSlider from 'nouislider'
import moment from 'moment';

const url = "https://covid19-it-api.herokuapp.com";

// *******************************************
// Map
// *******************************************


var map = new Map({
    target: 'map',
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

// *******************************************
// LAYERS
// *******************************************
// Regions polygons
var regionsLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    }),
    style: new Style({
        fill: new Fill({
          color: 'rgba(55,71,79,.75)',
        }),
        stroke: new Stroke({
          color: 'white'
        })
    })
});
// map.addLayer(regionsLayer);

// Regions centroids
var centroidsLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    }),
    style: function(feature) {
        const casi = parseInt(feature.get('casi'));
        var radius;
        if(casi >= 1 && casi <= 5){
            radius = 8;
        } else if(casi >= 6 && casi <= 15) {
            radius = 12;
        } else if (casi >= 16 && casi <= 30) {
            radius = 24;
        } else if (casi >= 31 && casi <= 50) {
            radius = 35;
        } else if (casi >= 51 && casi <= 70){
            radius = 45;
        } else if (casi >= 71 && casi <= 100){
            radius = 55;
        } else if (casi >= 101 && casi <= 150){
            radius = 65;
        } else if (casi >= 151 && casi <= 200){
            radius = 75;
        } else if (casi >= 201 && casi <= 250){
            radius = 85;
        } else if (casi >= 251 && casi <= 300){
            radius = 95;
        } else if (casi >= 301 && casi <= 400){
            radius = 110;
        } else {
            radius = 120;
        }

        return new Style({
            image: new Circle({
                radius: radius,
                fill: new Fill({color: 'rgba(255,0,0,.5)' }),
	            stroke: new Stroke({color: '#CC0000', width: 2})
            })
        })
        
    }
});
map.addLayer(centroidsLayer);

// Get Map Layers Data
axios.get('https://webgis.izs.it/arcgis/rest/services/ISTAT_ADMIN/MapServer/2/query',{
    params:{
        where: " 1=1 ",
        returnGeometry: true,
        outFields: 'DEN_REG',
        outSR: '3857',
        f: 'geojson'
    }
}).then(function(response){
    // console.log(response.data.features);
    var features = response.data.features;
    var collection = {"type": "FeatureCollection", "features": features};
    var featureCollection = new GeoJSON().readFeatures(collection);
    regionsLayer.getSource().addFeatures(featureCollection);
});

// Get COVID19 CPD Data
axios.get(url+'/data',{}).then(function(response){
    var dpc_bullettins = response.data;
    var dpc_bullettins_dates = []
    dpc_bullettins.forEach(function(resp){
        dpc_bullettins_dates.push(moment(resp.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss'))
    });
    var last_dpc_bullettin_date =  dpc_bullettins_dates.sort().reverse()[0];
    var last_dpc_bullettin = lodash.filter(dpc_bullettins, function(o) { 
        return moment(o.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') == last_dpc_bullettin_date; 
    });
    console.log(last_dpc_bullettin);
    // Update dashboard
    updateDashboardUI(last_dpc_bullettin);
    // Update centroids layer
    var features = last_dpc_bullettin[0].casi_accertati;
    var reprojected_features = []
    features.forEach(function(feature){
        var obj = {"type":"Feature","properties":feature.properties, "geometry":{"type":"Point",coordinates:new transform(feature.geometry.coordinates,'EPSG:4326','EPSG:3857')}}
        reprojected_features.push(obj)
    })
    var collection = {"type": "FeatureCollection", "features": reprojected_features};
    var featureCollection = new GeoJSON().readFeatures(collection);
    centroidsLayer.getSource().addFeatures(featureCollection);
});

const updateDashboardUI = function(data){
    // Dashboard title
    document.querySelector('#dashboard-title').innerHTML = '<i class="fas fa-tachometer-alt fa-lg"></i> '+ data[0].titolo
    // Update
    document.querySelector('#last-update').innerHTML = '<i class="far fa-clock"></i> Ultimo bollettino: <strong>'+ moment(data[0].aggiornamento_del).format('DD/MM/YYYY HH:mm:ss') + '</strong>'
    // Info origin
    document.querySelector('#data-source').innerHTML = '<i class="fas fa-link"></i> Origine delle informazioni: <strong><a target="_blank" href="'+data[0].link+'">Bollettino della Protezione Civile</a><strong>'
    // Populate chart
    regionDistributionChart(data[0].casi_accertati)
};

let myChart;
const regionDistributionChart = function(data){
    // Dataset
    var dataset = [];
    var labels = [];
    data.forEach(function(element){
        dataset.push(element.properties.casi);
        labels.push(element.properties.regione);
    })

    // Grafico
	var ctx = document.getElementById('region-distribution-chart').getContext('2d');
    if (myChart) { myChart.destroy(); }
    
    myChart = new Chart(ctx, {
		type: 'horizontalBar',
		data: {
			labels: labels,
			datasets:[{
				label: 'Casi accertati',
				backgroundColor: '#CC0000',
				borderColor: '#CC0000',
				data: dataset,
				fill: false
			}]
		},
		options: {
            responsive:true,
            legend:{
                display:false
            }
			/* onHover: function(evt) {
				var item = myChart.getElementAtEvent(evt);
				if (item.length) {
					console.log(item, evt.type);
				};
			} */
		}
	});

}