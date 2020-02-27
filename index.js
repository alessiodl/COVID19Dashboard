import '@fortawesome/fontawesome-free/js/all';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import {fromLonLat, transform} from 'ol/proj';
import {Tile as TileLayer, Image as ImageLayer} from 'ol/layer';
import {OSM} from 'ol/source';

import axios from 'axios';

import 'nouislider/distribute/nouislider.min.css';
import noUiSlider from 'nouislider'
import moment from 'moment';

const data_url = "https://covid19-it-api.herokuapp.com/data";

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

  fetch('./regioni.geojson')
      .then(response => respose.json())
      .then(data => {
        console.log(data)
      })
  