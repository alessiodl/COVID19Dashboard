import 'chart.js';
import 'chartjs-plugin-zoom';
import moment from 'moment';

let totCasesChart;
const casesDiffusionChart = function(data){
    data.reverse()
    // Dataset
    var total_cases = []
    var positive = []
    var dead = []
    var recovered = []
    var bullettin_dates = []
    data.forEach(d =>{
        total_cases.push(d.totale_casi) 
        positive.push(d.totale_attualmente_positivi)
        dead.push(d.deceduti)
        recovered.push(d.dimessi_guariti)
        bullettin_dates.push(moment(d.data).format('DD MMM'))
    });
    // Grafico
	var ctx = document.getElementById('total-cases-chart').getContext('2d');
    if (totCasesChart) {totCasesChart.destroy(); }
    
    totCasesChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: bullettin_dates,
			datasets:[{
				label: 'Contagiati',
				backgroundColor: '#ff4444',
				borderColor: '#ff4444',
				data: total_cases,
				fill: false
			},{
				label: 'Attualmente positivi',
				backgroundColor: '#CC0000',
				borderColor: '#CC0000',
				data: positive,
				fill: false
			},{
				label: 'Guariti',
				backgroundColor: '#e1f5fe',
				borderColor: '#e1f5fe',
				data: recovered,
				fill: false
			},{
				label: 'Deceduti',
				backgroundColor: '#5F497F',
				borderColor: '#5F497F',
				data: dead,
				fill: false
			}]
		},
		options: {
            responsive:true,
            aspectRatio: 2.4,
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

export { casesDiffusionChart }