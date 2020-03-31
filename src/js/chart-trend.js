import 'chart.js'
import 'chartjs-plugin-zoom'
import 'chartjs-plugin-colorschemes'
import 'chartjs-plugin-annotation'
import moment from 'moment'
import lodash from 'lodash'

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
        
        lodash.forEach(grouped_data,function(item, key){
            var data_arr = lodash.map(item, function(o) {
                if (o.prov == key) return o.totale_casi;
            });
            datasets.push({label:key, lineTension: 0, data:data_arr, fill:false})
        })
        
    } else {
        // console.log('dati nazionali')
        // Dataset
        data.reverse()
        data.forEach(d =>{
            total_cases.push(d.totale_casi) 
            positive.push(d.totale_positivi)
            dead.push(d.deceduti)
            recovered.push(d.dimessi_guariti)
            bullettin_dates.push(moment(d.data).format('DD MMM'))
        });

        var datasets = [{
            label: 'Contagiati',
            lineTension: 0,
            backgroundColor: '#ff4444',
            pointBackgroundColor: '#ff4444',
            borderColor: '#ff4444',
            pointBorderColor: '#ff4444',
            data: total_cases,
            fill: false
        },{
            label: 'Attualmente positivi',
            lineTension: 0,
            backgroundColor: '#CC0000',
            pointBackgroundColor: '#CC0000',
            borderColor: '#CC0000',
            pointBorderColor:'#CC0000',
            data: positive,
            fill: false
        },{
            label: 'Guariti',
            lineTension: 0,
            backgroundColor: '#e1f5fe',
            pointBackgroundColor: '#e1f5fe',
            borderColor: '#e1f5fe',
            pointBorderColor:'#e1f5fe',
            data: recovered,
            fill: false
        },{
            label: 'Deceduti',
            lineTension: 0,
            backgroundColor: '#1976d2',
            pointBackgroundColor: '#1976d2',
            borderColor: '#1976d2',
            pointBorderColor:'#1976d2',
            data: dead,
            fill: false
        }]
    }
    
    // Grafico
	var ctx = document.getElementById('total-cases-chart').getContext('2d');
    if (totCasesChart) {totCasesChart.destroy(); }

    var date_dpcm = ['25 Feb', '29 Feb', '08 Mar', '11 Mar', '22 Mar'];
    var desc_dpcm = ['Chiusura scuole Lombardia', 'dpcm zone rosse','dpcm #iorestoacasa', 'Chiusura ristoranti e negozi', 'dpcm'];
    var adjust_y_dpcm = [0, -40, 0, -40, 0]
    var adjust_x_dpcm = [25, 0, 0, 0, 0]
    // populate 'annotations' array dynamically based on 'marketing'
    var annotations = date_dpcm.map(function(date, index) {
    return {
        type: 'line',
        id: 'vline' + index,
        mode: 'vertical',
        scaleID: 'x-axis-0',
        value: date,
        borderColor: 'green',
        borderWidth: 1,
        label: {
            enabled: true,
            position: "center",
            fontStyle: "regular",
            fontSize: "10px",
            cornerRadius: 2,
            content: desc_dpcm[index],
            yAdjust: adjust_y_dpcm[index],
            xAdjust: adjust_x_dpcm[index]
        }
    }
    });
    
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
                    id: 'x-axis-0',
                    ticks:{
                        fontColor:'#FFF'
                    }
                }]
            }, 
            /*annotation:{
                drawTime: 'afterDatasetsDraw',
                annotations: annotations
            },*/
            plugins: {
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
                },
                colorschemes: {
                    scheme: 'brewer.SetThree12',
                    override: false
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