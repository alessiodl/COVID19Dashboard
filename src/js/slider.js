import 'nouislider/distribute/nouislider.min.css';
import noUiSlider from 'nouislider'
import moment from 'moment'
import axios from 'axios'

import { lastStateChartFn, lastOutcomesChartFn } from './chart-stato'
import { casesDiffusionChart } from './chart-cases'
import { regionDistribution } from './map'

const createSlider = function(_data_){

    var slider = document.querySelector('#slider');

    var dateArray = [];
    
    // Create Array of all dates
    _data_.forEach(element => {
        dateArray.push(element.data)
    });
    
    var first_date = dateArray[0]
    var last_date  = dateArray[ dateArray.length -1 ]
    
    // Calculate slider range values
    var rangers = {}
    
    rangers['min'] = moment(first_date).valueOf()
    for (var i = 0; i < dateArray.length; ++i) {
        var percent = Math.ceil((100/dateArray.length) * i)
        if ( i < dateArray.length-1 && i > 0) { 
            rangers[percent+'%'] = moment( dateArray[i] ).valueOf()
        }
    }
    rangers['max'] = moment( last_date ).valueOf()

    // Create Slider
    noUiSlider.create(slider, {
        start: moment(last_date).valueOf(),
        step: dateArray.length,
        snap: true,
        range: rangers
    });

    // Slider Update Event
    slider.noUiSlider.on('update', function (values, handle) {
        // console.log(parseInt(values[handle]))
        document.querySelector('#slider_current_value').innerHTML = moment(parseInt(values[handle])).format('DD MMM YYYY');
    });

    slider.noUiSlider.on('slide', function (values, handle){

        var slider_datetime = moment(parseInt(values[handle])).format('YYYY-MM-DD')+ ' 18:00:00';
        var url =  "https://covid19-it-api.herokuapp.com";

        axios.get(url+'/andamento',{ params:{ data: slider_datetime } }).then(function(response){
            console.log(response.data[0])
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
            var agg = ''
            if ( aggiornamento == '2020-02-29 18:00:00' || aggiornamento == '2020-03-01 18:00:00'  
                || aggiornamento == '2020-03-04 18:00:00' || aggiornamento == '2020-03-05 18:00:00' || aggiornamento == '2020-03-06 18:00:00') {
                agg = aggiornamento.replace('18:','17:');
            } else {
                agg = aggiornamento;
            }
            console.log(agg)
            regionDistribution(agg);
            // Trend Chart
            // casesDiffusionChart(response.data);
        });
    })

}

export { createSlider }