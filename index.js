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
// const url = "http://127.0.0.1:5000";

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

// Regions centroids
var centroidsLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    }),
    style: function(feature) {
        const casi = parseInt(feature.get('casi'));
        var radius;
        if(casi >= 1 && casi <= 5){
            radius = 4;
        } else if(casi >= 6 && casi <= 15) {
            radius = 10;
        } else if (casi >= 16 && casi <= 30) {
            radius = 15;
        } else if (casi >= 31 && casi <= 50) {
            radius = 18;
        } else if (casi >= 51 && casi <= 70){
            radius = 22;
        } else if (casi >= 71 && casi <= 100){
            radius = 30;
        } else if (casi >= 101 && casi <= 150){
            radius = 40;
        } else if (casi >= 151 && casi <= 200){
            radius = 50;
        } else if (casi >= 201 && casi <= 250){
            radius = 60;
        } else if (casi >= 251 && casi <= 300){
            radius = 70;
        } else if (casi >= 301 && casi <= 400){
            radius = 80;
        } else {
            radius = 100;
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

// Get COVID19 CPD Data
axios.get(url+'/data',{}).then(function(response){
    var dpc_bullettins = response.data;
    var dpc_bullettins_dates = []
    dpc_bullettins.forEach(function(resp){
        dpc_bullettins_dates.push(moment(resp.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss'))
    });
    var last_dpc_bullettin_date = dpc_bullettins_dates.sort().reverse()[0];
    var last_dpc_bullettin = lodash.filter(dpc_bullettins, function(o) { 
        return moment(o.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') == last_dpc_bullettin_date; 
    });

    // console.log('ultimo bottettino:', last_dpc_bullettin);
    // console.log('tutti i bottettini:', dpc_bullettins);

    // Buld total cases for bullettin chart
    casesDiffusionChart(dpc_bullettins);
    // Update dashboard
    updateDashboardUI(last_dpc_bullettin);
    // Build slider
    // buildSlider(dpc_bullettins);
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

// Build slider
const buildSlider = function(bullettins){

    bullettins = bullettins.sort(bullettin_sorter);

    var range_obj = {}
    var bullettin_dates = []

    bullettins.forEach((b,i) =>{
        if (i > 0 && i < bullettins.length-1){
            // console.log(Math.ceil((100/bullettins.length) * i))
            var date = moment(b.aggiornamento_del).format('DD/MM/YYYY HH:mm:ss')
            range_obj[Math.ceil((100/bullettins.length) * i)+'%'] = moment(date,'DD/MM/YYYY HH:mm:ss').valueOf()
        }
        bullettin_dates.push(moment(b.aggiornamento_del).format('DD/MM/YYYY HH:mm:ss'))
    });
    
    range_obj = Object.assign({min: moment(bullettin_dates[0],'DD/MM/YYYY HH:mm:ss').valueOf()}, range_obj);
    range_obj = Object.assign(range_obj, {max: moment(bullettin_dates[bullettin_dates.length-1],'DD/MM/YYYY HH:mm:ss').valueOf()});
    console.log(range_obj)

    var slider = document.querySelector('#slider');
    noUiSlider.create(slider, {
        start: moment(bullettin_dates[bullettin_dates.length-1],'DD/MM/YYYY HH:mm:ss').valueOf(),
        snap:true,
        connect: true,
        range: range_obj
    });
    
    slider.noUiSlider.on('update', function (values, handle) {
        //console.log(parseInt(values[0]),handle)
        var current_slider_date = moment(parseInt(values[0])).format('DD/MM/YYYY HH:mm:ss')
        console.log(current_slider_date)
        
    });

}

const updateDashboardUI = function(data){
    // Dashboard title
    document.querySelector('#dashboard-title').innerHTML = '<i class="fas fa-tachometer-alt fa-lg"></i> '+ data[0].titolo
    // Update
    document.querySelector('#last-update').innerHTML = '<i class="far fa-calendar-alt"></i> <strong><span style="font-size:18px;">'+ moment(data[0].aggiornamento_del).format('DD/MM/YYYY HH:mm') + '</span></strong>'
    // Info origin
    document.querySelector('#data-source').innerHTML = '<i class="fas fa-link"></i> <strong><a class="text-warning" target="_blank" href="'+data[0].link+'">Bollettino della Protezione Civile</a><strong>'
    // Populate chart
    regionDistributionChart(data[0].casi_accertati);
};

let regChart;
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
    if (regChart) {regChart.destroy(); }
    
    regChart = new Chart(ctx, {
		type: 'horizontalBar',
		data: {
			labels: labels,
			datasets:[{
				label: 'Casi accertati',
				backgroundColor: '#b71c1c',
				borderColor: '#CC0000',
				data: dataset,
				fill: false
			}]
		},
		options: {
            responsive:true,
            legend:{
                display:false
            },
            scales: {
                yAxes:[{
                    ticks:{
                        fontColor:'#FFF'
                    }
                }],
                xAxes:[{
                    ticks:{
                        fontColor:'#FFF'
                    }
                }]
            }
		}
	});
}

let totChart;
const casesDiffusionChart = function(bullettins){
    bullettins = bullettins.sort(bullettin_sorter);
    // Dataset
    var total_cases = []
    var bullettin_dates = []
    bullettins.forEach(b =>{
        total_cases.push(parseInt(b.titolo.match(/\d+/g))) // Take total number from bullettin title
        bullettin_dates.push(moment(b.aggiornamento_del).format('DD/MM/YYYY HH:mm'))
    });
    // console.log(total_cases)
    // console.log(bullettin_dates)
    // Grafico
	var ctx = document.getElementById('total-cases-chart').getContext('2d');
    if (totChart) {totChart.destroy(); }
    
    totChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: bullettin_dates,
			datasets:[{
				label: 'Casi accertati',
				backgroundColor: '#b71c1c',
				borderColor: '#CC0000',
				data: total_cases,
				fill: false
			}]
		},
		options: {
            responsive:true,
            legend:{
                display:false
            },
            scales: {
                yAxes:[{
                    ticks:{
                        fontColor:'#FFF'
                    }
                }],
                xAxes:[{
                    ticks:{
                        fontColor:'#FFF'
                    }
                }]
            }
		}
	});
}

// Custo sorting function useful for order DPC bullettis by their emission date
const bullettin_sorter = function( a, b ) {
    if ( moment(a.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') < moment(b.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') ){
      return -1;
    }
    if ( moment(a.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') > moment(b.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') ){
      return 1;
    }
    return 0;
}