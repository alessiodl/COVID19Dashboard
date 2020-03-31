import 'chart.js';
import 'chartjs-plugin-zoom';

let regChart;
const regionDistributionChart = function(data){

    data.sort(num_cases_sorter).reverse()

    if ('sigla_provincia' in data[0].properties){
        // console.log('dati per regione')
        // Dataset
        var tot_casi = [];
        var labels = [];
        data.forEach(function(element){
            tot_casi.push(element.properties.totale_casi);
            if (element.properties.totale_casi > 0){
                labels.push(element.properties.denominazione_provincia);
            }
        })

        var datasets = [{
            label: 'Contagiati',
            backgroundColor: '#ff4444',
            borderColor: '#ff4444',
            data: tot_casi,
            fill: false
        }]

    } else {
        // console.log('dati nazionali')
        // Dataset
        var tot_casi = [];
        var tot_positivi = [];
        var tamponi = [];
        var labels = [];
        data.forEach(function(element){
            tot_casi.push(element.properties.totale_casi);
            tot_positivi.push(element.properties.totale_positivi);
            tamponi.push(element.properties.tamponi);
            if (element.properties.totale_casi > 0){
                labels.push(element.properties.denominazione_regione);
            }
        });

        var datasets = [{
            label: 'Tamponi',
            backgroundColor: '#ef9a9a',
            borderColor: '#ef9a9a',
            data: tamponi,
            fill: false,
            hidden:true,
        },{
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
    }
    
    // Grafico
	var ctx = document.getElementById('region-distribution-chart').getContext('2d');
    if (regChart) {regChart.destroy(); }
    
    regChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets: datasets
		},
		options: {
            responsive:true,
            // aspectRatio: 2.7,
            maintainAspectRatio: false,
            title: {
                display: false,
                text: 'Distribuzione casi',
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