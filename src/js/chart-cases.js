import 'chart.js';
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
        total_cases.push(d.totale) 
        positive.push(d.positivi)
        dead.push(d.deceduti)
        recovered.push(d.guariti)
        bullettin_dates.push(moment(d.aggiornamento).format('DD MMM, HH:mm'))
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
				backgroundColor: '#dc3545',
				borderColor: '#dc3545',
				data: total_cases,
				fill: false
			},{
				label: 'Positivi',
				backgroundColor: '#FF8800',
				borderColor: '#FF8800',
				data: positive,
				fill: false
			},{
				label: 'Guariti',
				backgroundColor: '#00C851',
				borderColor: '#00C851',
				data: recovered,
				fill: false
			},{
				label: 'Morti',
				backgroundColor: '#aa66cc',
				borderColor: '#aa66cc',
				data: dead,
				fill: false
			}]
		},
		options: {
            responsive:true,
            aspectRatio: 4,
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
            }
		}
	});
}

export { casesDiffusionChart }