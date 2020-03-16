import 'chart.js';
import 'chartjs-plugin-zoom';
import moment from 'moment';

let newCasesChart;
const newCasesDiffusionChart = function(data){
    // Dataset
    var total_cases = []
    var positive = []
    var dead = []
    var recovered = []
    var bullettin_dates = []
    data.forEach(d =>{
        total_cases.push(d.totale_casi) 
        positive.push(d.totale_attualmente_positivi)
        // dead.push(d.deceduti)
        // recovered.push(d.dimessi_guariti)
        bullettin_dates.push(moment(d.data).format('DD MMM'))
    });

    var total_cases_daily_increment = [0]
    total_cases.forEach(function(element,index){
        if (index > 0){
            var daily_increment = element - total_cases[index -1];
            total_cases_daily_increment.push(daily_increment)
        }
        // console.log(total_cases_daily_increment)
    });

    // Grafico
	var ctx = document.getElementById('new-cases-chart').getContext('2d');
    if (newCasesChart) {newCasesChart.destroy(); }
    
    newCasesChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: bullettin_dates,
			datasets:[{
				label: 'Casi in più',
				backgroundColor: '#ff4444',
				borderColor: '#ff4444',
				data: total_cases_daily_increment,
				fill: false
			}]
		},
		options: {
            responsive:true,
            aspectRatio: 2.4,
            legend:{
                display:false,
                position: 'top',
                labels:{
                    fontColor:'#bdbdbd'
                }
            },
            title:{
                display: true,
                text: 'Casi in più rispetto al giorno precedente',
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