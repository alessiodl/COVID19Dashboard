import 'chart.js';
import 'chartjs-plugin-zoom';
import moment from 'moment';

let newCasesChart;
const newCasesDiffusionChart = function(data){
    // console.log(data)

    // Dataset
    var total_cases     = []
    var positive        = []
    var deceduti        = []
    var dimessi_guariti = []
    var bullettin_dates = []
    
    data.forEach(d =>{
        total_cases.push(d.totale_casi) 
        positive.push(d.totale_positivi)
        deceduti.push(d.deceduti)
        dimessi_guariti.push(d.dimessi_guariti)
        bullettin_dates.push(moment(d.data).format('DD MMM'))
    });
    
    var positive_daily_increment = [0]
    positive.forEach(function(element,index){
        if (index > 0){
            var daily_increment = element - positive[index -1];
            if (daily_increment > 0){
                positive_daily_increment.push(daily_increment)
            } else {
                positive_daily_increment.push(0)
            }
        }
        // console.log(positive_daily_increment)
    });

    var deceduti_daily_increment = [0]
    deceduti.forEach(function(element,index){
        if (index > 0){
            var daily_increment = element - deceduti[index -1];
            if (daily_increment > 0){
                deceduti_daily_increment.push(daily_increment)
            } else {
                deceduti_daily_increment.push(0)
            }
        }
        // console.log(deceduti_daily_increment)
    });

    var guariti_daily_increment = [0]
    dimessi_guariti.forEach(function(element,index){
        if (index > 0){
            var daily_increment = element - dimessi_guariti[index -1];
            if (daily_increment > 0){
                guariti_daily_increment.push(daily_increment)
            } else {
                guariti_daily_increment.push(0)
            }
        } else {
            guariti_daily_increment.push(0)
        }
        // console.log(guariti_daily_increment)
    });

    // Grafico
	var ctx = document.getElementById('new-cases-chart').getContext('2d');
    if (newCasesChart) {newCasesChart.destroy(); }
    
    newCasesChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: bullettin_dates,
			datasets:[{
				label: 'attualmente positivi in più',
				backgroundColor: '#CC0000',
				borderColor: '#CC0000',
				data: positive_daily_increment,
				fill: false
			},{
				label: 'guariti in più',
				backgroundColor: '#e1f5fe',
				borderColor: '#e1f5fe',
				data: guariti_daily_increment,
				fill: false
			},{
				label: 'deceduti in più',
				backgroundColor: '#1976d2',
				borderColor: '#1976d2',
				data: deceduti_daily_increment,
				fill: false
			}]
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
            title:{
                display: true,
                text: 'Incrementi rispetto al giorno precedente',
                fontColor:'#bdbdbd'
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

export { newCasesDiffusionChart }