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
axios.get('https://webgis.izs.it/arcgis/rest/services/ISTAT_ADMIN/MapServer/2/query',{
    params:{
        where: " 1=1 ",
        returnGeometry: true,
        outFields: 'DEN_REG',
        outSR: '3857',
        f: 'geojson'
    }
}).then(function(response){
    console.log(response.data.features);
    var features = response.data.features;
    var collection = {"type": "FeatureCollection", "features": features};
    var featureCollection = new GeoJSON().readFeatures(collection);
    regionsLayer.getSource().addFeatures(featureCollection);
    // Populate cetroids
    var centroids = [];
    features.forEach(feature => {
        // console.log(centroid(feature));
        centroids.push(centroid(feature));
    });
    var centroidsCollection = new GeoJSON().readFeatures({"type": "FeatureCollection", "features": centroids});
    centroidsLayer.getSource().addFeatures(centroidsCollection);
});

// Get COVID19 CPD Data
axios.get(url+'/data',{}).then(function(response){
    console.log(response.data);
});