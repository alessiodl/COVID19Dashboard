import './scss/main.scss';
import '@fortawesome/fontawesome-free/js/all';
// Bootstrap
import $ from 'jquery';
import 'popper.js';
import 'bootstrap';
// Bootstrap select
import 'bootstrap-select';
$.fn.selectpicker.Constructor.BootstrapVersion = '4';
import 'bootstrap-select/dist/css/bootstrap-select.min.css';
// App
import './js/map';
/*
const calcMapHeigh = () => {
    var h = $("#filters-col").height() + $("#pie-col").height() + $('#tab-charts-col').height() -15
    console.log(h)
    $('#map-container').height(h)
}

$( window ).resize(function() {
    calcMapHeigh()
  })

setTimeout(function(){
    calcMapHeigh()
},1500)
*/