import $ from 'jquery'
import axios from 'axios';
import moment from 'moment';

import { zoomToGeometry,zoomRegionLayer,zoomToItaly } from './map';
import { lastStateChartFn, lastOutcomesChartFn } from './chart-stato'
import { regionDistributionChart } from './chart-regioni';
import { newCasesDiffusionChart } from './chart-new-cases';
import { trendChart } from './chart-trend';

const populateRegionsMenu = function(data){
    // console.log(data[0])
    $('#select-regione').empty()
    data.forEach((element)=>{
        var value = element.properties.codice_regione;
        var label = element.properties.denominazione_regione;
        $('#select-regione').append('<option value="'+value+'">'+label+'</option>')
        $('#select-regione').selectpicker('val','');
        $('#select-regione').selectpicker('refresh');
    });
}

document.querySelector('#select-regione').addEventListener('change',function(e){
    var sel_reg = e.target.value
    regionsFilter(sel_reg)
    regionsTrend(sel_reg)
    regionsNewCases(sel_reg)
    regionsState(sel_reg)
})
  
$('#reset-filters-btn').click(function(){
    resetFilters()
})

const regionsFilter = function(reg){
    // console.log(reg)
    var aggiornamento = moment(new Date(document.querySelector("#data-at").textContent)).format('YYYY-MM-DD')
    var params;
    if (reg == 41){
        params = { data:aggiornamento, sigla_prov:"TN" }
    } else if (reg == 42){
        params = { data:aggiornamento, sigla_prov:"BZ" }
    } else {
        params = { data: aggiornamento, cod_reg: reg }
    }

    axios.get('https://covid19-it-api.herokuapp.com/province',{ params:params}).then(function(response){
        // Set Map Zoom
        zoomToGeometry(reg)
        // Update distribution chart
        regionDistributionChart(response.data.features)
        // Update dashboard counter
        var casesArr = []
        response.data.features.forEach(feature =>{
            casesArr.push(parseInt(feature.properties.totale_casi))
        })
        var regionTotalCases = casesArr.reduce( function(total,num){return total+Math.round(num)} )
        document.querySelector('#tot-contagi-reg').innerHTML = regionTotalCases+" Contagiati"
    })

    regionsState(reg)
}

const regionsTrend = function(reg){
    var params;
    if (reg == 41){
        params = { sigla_prov:"TN" }
    } else if (reg == 42){
        params = { sigla_prov:"BZ" }
    } else {
        params = { cod_reg: reg }
    }

    axios.get('https://covid19-it-api.herokuapp.com/province',{ params:params}).then(function(response){
        var chartsData = []
        response.data.features.forEach(feature => {
            chartsData.push(feature.properties)
        })
        // trend Chart for Each Region (showing provinces)
        trendChart(chartsData)
    })
}

const regionsNewCases = function(reg){
    var params;
    if (reg == 41){
        params = { cod_reg:"4" }
    } else if (reg == 42){
        params = { cod_reg:"4" }
    } else {
        params = { cod_reg: reg }
    }

    axios.get('https://covid19-it-api.herokuapp.com/regioni',{ params:params}).then(function(response){
        var chartsData = []
        response.data.features.forEach(feature => {
            chartsData.push(feature.properties)
        })
        // new Cases Chart by Region
        newCasesDiffusionChart(chartsData)
    })
}

const regionsState = function(reg){

    var aggiornamento = moment(new Date(document.querySelector("#data-at").textContent)).format('YYYY-MM-DD')

    var params;
    if (reg == 41){
        params = { data:aggiornamento, cod_reg:"4" }
    } else if (reg == 42){
        params = { data:aggiornamento, cod_reg:"4" }
    } else {
        params = { data:aggiornamento, cod_reg: reg }
    }

    axios.get('https://covid19-it-api.herokuapp.com/regioni',{ params:params}).then(function(response){
        var chartsData = []
        response.data.features.forEach(feature => {
            chartsData.push(feature.properties)
        })
        // new State Charts by Region
        lastStateChartFn(chartsData[0]) 
        lastOutcomesChartFn(chartsData[0])
    })
}

const resetFilters = function(){
    $('#select-regione').selectpicker('val','');
    $('#select-regione').selectpicker('refresh');
    var aggiornamento = moment(new Date(document.querySelector("#data-at").textContent)).format('YYYY-MM-DD')
    // Reset region chart
    axios.get('https://covid19-it-api.herokuapp.com/regioni/map',{ params:{ data: aggiornamento }}).then(function(response){
        var features = response.data.features;
        regionDistributionChart(features)
    });
    // Clear selected region layer and reset zoom
    zoomRegionLayer.getSource().clear();
    zoomToItaly();
    // Reset counter
    document.querySelector('#tot-contagi-reg').innerHTML = ""

    // Trend and New Cases Charts
    axios.get('https://covid19-it-api.herokuapp.com/andamento',{ params:{} }).then(function(response){
        trendChart(response.data);
        newCasesDiffusionChart(response.data)
        // new State Charts by Region
        lastStateChartFn(response.data.reverse()[0]) 
        lastOutcomesChartFn(response.data.reverse()[0])
    });

    // Reset State Charts
    axios.get('https://covid19-it-api.herokuapp.com/andamento',{ params:{data:aggiornamento} }).then(function(response){
        lastStateChartFn(response.data[0]) 
        lastOutcomesChartFn(response.data[0])
    });

}

export { populateRegionsMenu, regionsFilter, resetFilters }