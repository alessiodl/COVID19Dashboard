import 'chart.js';

let regChart;
const regionDistributionChart = function(data){
    data.sort(num_cases_sorter).reverse()
    // Dataset
    var dataset = [];
    var labels = [];
    data.forEach(function(element){
        dataset.push(element.properties.numero_casi);
        labels.push(element.properties.regione);
    })
    // Grafico
	var ctx = document.getElementById('region-distribution-chart').getContext('2d');
    if (regChart) {regChart.destroy(); }
    
    regChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets:[{
				label: 'Casi accertati',
				backgroundColor: '#dc3545',
				borderColor: '#CC0000',
				data: dataset,
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
                display:false
            },
            scales: {
                yAxes:[{
                    ticks:{
                        fontColor:'#FFF'
                    }
                }],
                xAxes:[{
                    ticks:{
                        fontColor:'#FFF',
                        callback: function(value, index, values) {
                            if (value == ' Provincia autonoma di Trento'){
                                return 'P.A. Trento';
                            } else if (value == ' Provincia autonoma di Bolzano') {
                                return 'P.A. Bolzano';
                            } else if (value == ' Friuli Venezia Giulia') {
                                return 'Friuli';
                            } else {
                                return value;
                            }
                        }
                    }
                }]
            }
		}
	});
}

// Ordinamento per numero di casi
const num_cases_sorter = function( a, b ) {
    if ( a.properties.numero_casi < b.properties.numero_casi ){
      return -1;
    }
    if ( a.properties.numero_casi > b.properties.numero_casi ){
      return 1;
    }
    return 0;
}

export { regionDistributionChart };