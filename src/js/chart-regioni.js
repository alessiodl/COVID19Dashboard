import 'chart.js';
import 'chartjs-plugin-zoom';

let regChart;
const regionDistributionChart = function(data){
    data.sort(num_cases_sorter).reverse()
    // Dataset
    var tot_casi = [];
    var tot_positivi = [];
    var labels = [];
    data.forEach(function(element){
        tot_casi.push(element.properties.totale_casi);
        tot_positivi.push(element.properties.totale_attualmente_positivi);
        if (element.properties.totale_casi > 0){
            labels.push(element.properties.denominazione_regione);
        }
    })
    // Grafico
	var ctx = document.getElementById('region-distribution-chart').getContext('2d');
    if (regChart) {regChart.destroy(); }
    
    regChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets:[{
				label: 'Contagiati',
				backgroundColor: '#ff4444',
				borderColor: '#ff4444',
				data: tot_casi,
				fill: false
			},{
				label: 'Attualmente positivi',
				backgroundColor: '#CC0000',
				borderColor: '#CC0000',
				data: tot_positivi,
				fill: false
			}]
		},
		options: {
            responsive:true,
            aspectRatio: 3,
            title: {
                display: false,
                text: 'Distribuzione per Regione',
                fontColor:'#FFF',
                fontStyle: 'bold',
                fontSize: 12
            },
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
                        enabled:false,
                        mode:'xy'
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

// Ordinamento per numero di casi
const num_cases_sorter = function( a, b ) {
    if ( a.properties.totale_casi < b.properties.totale_casi ){
      return -1;
    }
    if ( a.properties.totale_casi > b.properties.totale_casi ){
      return 1;
    }
    return 0;
}

export { regionDistributionChart };