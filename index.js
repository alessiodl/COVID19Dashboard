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
import {Style, Fill, Stroke} from 'ol/style';
import {OSM} from 'ol/source';
import '@turf/centroid';

import axios from 'axios';
import lodash from 'lodash'

import 'nouislider/distribute/nouislider.min.css';
import noUiSlider from 'nouislider'
import moment from 'moment';
import centroid from '@turf/centroid';

const url = "https://covid19-it-api.herokuapp.com";

// *******************************************
// Map
// *******************************************
var map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: fromLonLat([14, 42]),
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
map.addLayer(regionsLayer);

// Regions centroids
var centroidsLayer = new VectorImageLayer({
    source: new VectorSource({
        format: new GeoJSON()
    })
});
map.addLayer(centroidsLayer);

// Get Map Layers Data
var centroidsCollection;
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
    // Populate cetroids
    var centroids = [];
    features.forEach(feature => {
        centroids.push(centroid(feature, {properties:{properties:{"denominazione":feature.properties.DEN_REG,"casi_accertati":0}}}));
    });
    centroidsCollection = new GeoJSON().readFeatures({"type": "FeatureCollection", "features": centroids});
    centroidsLayer.getSource().addFeatures(centroidsCollection);
    // console.log(centroidsCollection)
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

    // var points = centroidsLayer.getSource().getFeatures();
    centroidsCollection.forEach(function(point){
        console.log(point) 
    });
});