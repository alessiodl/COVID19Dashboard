import 'chart.js';
import 'chartjs-plugin-zoom';
import moment from 'moment';
import lodash from 'lodash'
import chroma from 'chroma-js';

let totCasesChart;
const trendChart = function(data){
    var provinces = []
    var provinces_total_cases = []
    var total_cases = []
    var positive = []
    var dead = []
    var recovered = []
    var bullettin_dates = []
    if ('sigla_provincia' in data[0]){
        // console.log('dati regionali')
        data.forEach(d =>{
            provinces.push(d.denominazione_provincia)
            provinces_total_cases.push({ "prov":d.denominazione_provincia, "totale_casi":d.totale_casi, "data":moment(d.data).format('YYYY-MM-DD HH:mm:ss') })
            bullettin_dates.push(moment(d.data).format('DD MMM'))
        });
        bullettin_dates = removeDuplicates(bullettin_dates)
        // console.log(grouped_data)
        var grouped_data = lodash.groupBy(provinces_total_cases,"prov");
        var datasets = []
        /*var colors = [
            '#8dd3c7','#ffffb3','#bebada','#fb8072',
            '#80b1d3','#fdb462','#b3de69','#fccde5',
            '#d9d9d9', '#bc80bd','#ccebc5','#ffed6f'
        ]*/
        var colors = chroma.scale('OrRd').colors(12)
        lodash.forEach(grouped_data,function(item, key){
            var data_arr = lodash.map(item, function(o) {
                if (o.prov == key) return o.totale_casi;
            });
            var randomColor = lodash.sample(colors)
            datasets.push({label:key, lineTension: 0, data:data_arr,fill:false,backgroundColor: randomColor, borderColor: randomColor})
        })
        
    } else {
        // console.log('dati nazionali')
        // Dataset
        data.reverse()
        data.forEach(d =>{
            total_cases.push(d.totale_casi) 
            positive.push(d.totale_attualmente_positivi)
            dead.push(d.deceduti)
            recovered.push(d.dimessi_guariti)
            bullettin_dates.push(moment(d.data).format('DD MMM'))
        });

        var datasets = [{
            label: 'Contagiati',
            lineTension: 0,
            backgroundColor: '#ff4444',
            borderColor: '#ff4444',
            data: total_cases,
            fill: false
        },{
            label: 'Attualmente positivi',
            backgroundColor: '#CC0000',
            lineTension: 0,
            borderColor: '#CC0000',
            data: positive,
            fill: false
        },{
            label: 'Guariti',
            lineTension: 0,
            backgroundColor: '#e1f5fe',
            borderColor: '#e1f5fe',
            data: recovered,
            fill: false
        },{
            label: 'Deceduti',
            lineTension: 0,
            backgroundColor: '#1976d2',
            borderColor: '#1976d2',
            data: dead,
            fill: false
        }]
    }
    
    
    // Grafico
	var ctx = document.getElementById('total-cases-chart').getContext('2d');
    if (totCasesChart) {totCasesChart.destroy(); }
    
    totCasesChart = new Chart(ctx, {
        type: 'line',
		data: {
			labels: bullettin_dates,
			datasets: datasets
		},
		options: {
            responsive:true,
            // aspectRatio: 2.7,
            maintainAspectRatio: false,
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
            },
            plugins:{
                zoom:{
                    pan:{
                        enabled:true,
                        mode:'x'
                    },
                    zoom: {
                        enabled: true,
                        mode: 'x',
                        speed: 0.05
                    }
                }
            }
		}
	});
}

const removeDuplicates = function(arr) {
    let unique = {};
    arr.forEach(function(i) {
        if(!unique[i]) {
            unique[i] = true;
        }
    });
    return Object.keys(unique);
}

export { trendChart }