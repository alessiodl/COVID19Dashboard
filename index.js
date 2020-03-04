import '@fortawesome/fontawesome-free/js/all';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import {fromLonLat, transform} from 'ol/proj';
import {Heatmap as HeatmapLayer, Tile as TileLayer} from 'ol/layer';
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

// Regions centroids
var centroidsLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    }),
    style: function(feature) {
        const casi = parseInt(feature.get('numero_casi'));
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
            radius = 35;
        } else if (casi >= 151 && casi <= 200){
            radius = 45;
        } else if (casi >= 201 && casi <= 250){
            radius = 50;
        } else if (casi >= 251 && casi <= 300){
            radius = 55;
        } else if (casi >= 301 && casi <= 400){
            radius = 60;
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
map.addLayer(centroidsLayer);

/* 
var heatmap = new HeatmapLayer({
    source: new VectorSource({
      format: new GeoJSON()
    }),
    blur: 35,
    radius: 30,
    weight: function(feature) {
        var casi = feature.get('numero_casi');

        return (casi*100)/2502;
    }
});
map.addLayer(heatmap);
*/

// Get COVID19 Last Regional Distribution
axios.get(url+'/distribution/regions/last',{}).then(function(response){
    // Spatial data
    var features = response.data.features;
    var reprojected_features = [];
    features.forEach(function(feature){
        var obj = {"type":"Feature","properties":feature.properties, "geometry":{"type":"Point",coordinates:new transform(feature.geometry.coordinates,'EPSG:4326','EPSG:3857')}}
        reprojected_features.push(obj);
    })
    var collection = {"type": "FeatureCollection", "features": reprojected_features};
    var featureCollection = new GeoJSON().readFeatures(collection);
    // Populate centroids layer
    centroidsLayer.getSource().addFeatures(featureCollection);
    // Populate heatmap layer
    // heatmap.getSource().addFeatures(featureCollection);
    // Regional Distribution Chart
    regionDistributionChart(features)
});

// Get COVID19 Summary Data
axios.get(url+'/summary',{ data: '' }).then(function(response){
    var totale_contagiati = response.data[0].totale;
    var data_aggiornamento = response.data[0].aggiornamento;
    var data_source = "http://www.salute.gov.it/portale/nuovocoronavirus/dettaglioContenutiNuovoCoronavirus.jsp?lingua=italiano&id=5351&area=nuovoCoronavirus&menu=vuoto"
    // Title
    // document.querySelector('#dashboard-title').innerHTML = '<i class="fas fa-tachometer-alt fa-lg"></i> Coronavirus: '+ totale_contagiati + ' contagiati'
    // Update
    document.querySelector('#last-update').innerHTML = '<i class="far fa-calendar-alt fa-fw"></i> <strong><span style="font-size:18px;">'+ moment(data_aggiornamento).format('DD/MM/YYYY HH:mm') + '</span></strong>'
    // Count
    document.querySelector('#last-cases').innerHTML = '<i class="fas fa-tachometer-alt fa-fw"></i> <span style="font-size:18px;"> <strong>'+ totale_contagiati + '</strong> contagiati'
    // Info origin
    document.querySelector('#data-source').innerHTML = '<i class="fas fa-link fa-fw"></i> <strong><a class="text-warning" target="_blank" href="'+data_source+'">Ministero della Salute</a><strong>'
    // Trend Chart
    casesDiffusionChart(response.data);
    // LastState Chart
    lastStateChartFn(response.data)
});

// Get COVID19 State Data
axios.get(url+'/state',{ data: '' }).then(function(response){
    // LastState Chart
    setTimeout(function(){lastStateChartFn(response.data[0])},250);
});

// Build slider
/*
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
*/

let regChart;
const regionDistributionChart = function(data){
    data.sort(num_cases_sorter).reverse()
    // Dataset
    var dataset = [];
    var labels = [];
    data.forEach(function(element){
        dataset.push(element.properties.numero_casi);
        labels.push(element.properties.regione);
    })
    // Grafico
	var ctx = document.getElementById('region-distribution-chart').getContext('2d');
    if (regChart) {regChart.destroy(); }
    
    regChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets:[{
				label: 'Casi accertati',
				backgroundColor: '#dc3545',
				borderColor: '#CC0000',
				data: dataset,
				fill: false
			}]
		},
		options: {
            responsive:true,
            title: {
                display: true,
                text: 'Distribuzione per Regione',
                fontColor:'#FFF',
                fontStyle: 'bold',
                fontSize: 12
            },
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
                        fontColor:'#FFF',
                        callback: function(value, index, values) {
                            if (value == ' Provincia autonoma di Trento'){
                                return 'P.A. Trento';
                            } else if (value == ' Provincia autonoma di Bolzano') {
                                return 'P.A. Bolzano';
                            } else if (value == ' Friuli Venezia Giulia') {
                                return 'Friuli';
                            } else {
                                return value;
                            }
                        }
                    }
                }]
            }
		}
	});
}

let lastStateChart;
const lastStateChartFn = function(data){
    // console.log(data.aggiornamento)
    var domiciliare = data.isolamento_domiciliare;
    var ricoverati  = data.ricoverati_con_sintomi;
    var tintensiva  = data.terapia_intensiva;
    // Grafico
	var ctx = document.getElementById('last-state-chart').getContext('2d');
    if (lastStateChart) {lastStateChart.destroy(); }
    lastStateChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels:['Isolamento domiciliare','Ricoverati con sintomi','in Terapia intensiva'],
            datasets:[{
                data: [domiciliare,ricoverati,tintensiva],
                backgroundColor: ['#ef9a9a','#dc3545','#b71c1c'],
                borderColor: ['#ef9a9a','#dc3545','#b71c1c']
            }]
        },
        options: {
            responsive:true,
            title: {
                display: true,
                text: 'Situazione dei contagiati',
                fontColor:'#FFF',
                fontStyle: 'bold',
                fontSize: 12
            },
            legend:{
                display:true,
                position: 'right',
                labels:{
                    fontColor:'#bdbdbd'
                }
            }
        } 
    })
}

let totChart;
const casesDiffusionChart = function(data){
    data.reverse()
    // Dataset
    var total_cases = []
    var positive = []
    var dead = []
    var recovered = []
    var bullettin_dates = []
    data.forEach(d =>{
        total_cases.push(d.totale) 
        positive.push(d.positivi)
        dead.push(d.deceduti)
        recovered.push(d.guariti)
        bullettin_dates.push(moment(d.aggiornamento).format('DD MMM, HH:mm'))
    });
    // Grafico
	var ctx = document.getElementById('total-cases-chart').getContext('2d');
    if (totChart) {totChart.destroy(); }
    
    totChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: bullettin_dates,
			datasets:[{
				label: 'Contagiati',
				backgroundColor: '#dc3545',
				borderColor: '#dc3545',
				data: total_cases,
				fill: false
			},{
				label: 'Positivi',
				backgroundColor: '#FF8800',
				borderColor: '#FF8800',
				data: positive,
				fill: false
			},{
				label: 'Guariti',
				backgroundColor: '#00C851',
				borderColor: '#00C851',
				data: recovered,
				fill: false
			},{
				label: 'Morti',
				backgroundColor: '#aa66cc',
				borderColor: '#aa66cc',
				data: dead,
				fill: false
			}]
		},
		options: {
            responsive:true,
            title: {
                display: true,
                text: 'Evoluzione dal 24 Febbraio 2020 alla data odierna',
                fontColor:'#FFF',
                fontStyle: 'bold',
                fontSize: 16
            },
            legend:{
                display:true,
                position: 'top',
                labels:{
                    fontColor:'#bdbdbd'
                }
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

// Custom sorting function useful for order DPC bullettis by their emission date
/*
const bullettin_sorter = function( a, b ) {
    if ( moment(a.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') < moment(b.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') ){
      return -1;
    }
    if ( moment(a.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') > moment(b.aggiornamento_del).format('YYYY-MM-DD HH:mm:ss') ){
      return 1;
    }
    return 0;
}
*/

// Ordinamento per numero di casi
const num_cases_sorter = function( a, b ) {
    if ( a.properties.numero_casi < b.properties.numero_casi ){
      return -1;
    }
    if ( a.properties.numero_casi > b.properties.numero_casi ){
      return 1;
    }
    return 0;
}