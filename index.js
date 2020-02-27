import '@fortawesome/fontawesome-free/js/all';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import {fromLonLat, transform} from 'ol/proj';
import {Tile as TileLayer} from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {OSM} from 'ol/source';

import axios from 'axios';

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
        source: new OSM()
      }),
      new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: './regioni.geojson'
        })
      })
    ],
    view: new View({
      center: fromLonLat([14, 42]),
      zoom: 6
    })
  });


  // Get COVID19 CPD Data
  axios.get(url+'/data',{
  }).then(function(response){
    console.log(response)
  });
  