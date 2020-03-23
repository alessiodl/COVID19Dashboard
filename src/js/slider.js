import 'nouislider/distribute/nouislider.min.css';
import noUiSlider from 'nouislider'
import moment from 'moment'
import axios from 'axios'

import { lastStateChartFn, lastOutcomesChartFn } from './chart-stato'
//import { casesDiffusionChart } from './chart-trend'
import { regionDistribution, provincesDistribution } from './map'
import { regionsFilter } from './filters'

const createSlider = function(_data_){

    const slider = document.querySelector('#slider');
    
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
        range: rangers,
        pips: {
            mode: 'range', 
            filter: function (value, type) {
                if (type === 0) {
                    return -1;
                } else {
                    // Crea il pip con label solo per i giorni pari
                    if (moment(value).format('DD')%2==0){
                        return 1
                    }
                }
            },
            format:{
                to: function(value){
                    return moment(value).format('DD/MM')
                }
            },
            density:4
        }
    });

    slider.noUiSlider.on('update', function (values, handle){

        var url =  "https://covid19-it-api.herokuapp.com";

        var slider_date = moment(parseInt(values[handle])).format('YYYY-MM-DD');

        axios.get(url+'/andamento',{ params:{ data: slider_date } }).then(function(response){
            // console.log(response.data[0])
            var totale_casi = response.data[0].totale_casi;
            var aggiornamento = response.data[0].data;
            // Update total count
            document.querySelector("#tot-contagi").innerHTML = totale_casi
            // Update date
            document.querySelector("#data-at").innerHTML = moment(aggiornamento).format('DD MMM YYYY')
            // LastState Chart
            lastStateChartFn(response.data[0])
            // Last Outcomes Chart
            lastOutcomesChartFn(response.data[0])
            // Populate region distribution layer and chart
            if (document.querySelector('#select-regione').value == ''){
                regionDistribution(slider_date);
            } else {
                var reg_code = document.querySelector('#select-regione').value
                regionsFilter(reg_code)
                
            }
            // Populate provinces distribution layer
            provincesDistribution(slider_date);
        });
    })

    // Slider play tools
    var step_bw = document.querySelector("#slider-step-bw")
    var step_fw = document.querySelector("#slider-step-fw")

    step_bw.addEventListener('click', function(e){
        var slider_start_position = slider.noUiSlider.get()
        var slider_date = moment(parseInt(slider_start_position)).valueOf()
        var bw_date = moment(slider_date).subtract(24, "h").valueOf()
        // alert(bw_date)
        slider.noUiSlider.set(bw_date)
    });

    step_fw.addEventListener('click', function(e){
        var slider_start_position = slider.noUiSlider.get()
        var slider_date = moment(parseInt(slider_start_position)).valueOf()
        var fw_date = moment(slider_date).add(24, "h").valueOf()
        // alert(fw_date)
        slider.noUiSlider.set(fw_date)
    });

}

export { createSlider }