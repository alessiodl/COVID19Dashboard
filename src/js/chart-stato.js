import 'chart.js';

let lastStateChart;
const lastStateChartFn = function(data){
    // console.log(data)
    var domiciliare = data.isolamento_domiciliare;
    var ricoverati  = data.ricoverati_con_sintomi;
    var tintensiva  = data.terapia_intensiva;
    // Grafico
	var ctx = document.getElementById('last-state-chart').getContext('2d');
    if (lastStateChart) {lastStateChart.destroy(); }
    lastStateChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels:['Isolamento domiciliare','Ricoverati con sintomi','Terapia intensiva'],
            datasets:[{
                data: [domiciliare,ricoverati,tintensiva],
                backgroundColor: ['#ef9a9a','#dc3545','#b71c1c'],
                borderColor: ['#ef9a9a','#dc3545','#b71c1c']
            }]
        },
        options: {
            responsive:true,
            aspectRatio: 4.1,
            legend:{
                display:true,
                position: 'right',
                labels:{
                    fontColor:'#bdbdbd'
                }
            }
        } 
    })
}

let lastOutcomesChart;
const lastOutcomesChartFn = function(data){
    var positivi = data.totale_attualmente_positivi;
    var deceduti = data.deceduti;
    var guariti  = data.dimessi_guariti;
    // Grafico
	var ctx = document.getElementById('last-outcome-chart').getContext('2d');
    if (lastOutcomesChart) {lastOutcomesChart.destroy(); }
    lastOutcomesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels:[/*'Positivi',*/'Deceduti','Guariti'],
            datasets:[{
                data: [/*positivi,*/deceduti,guariti],
                backgroundColor: [/*'#dc3545',*/'#1976d2','#e1f5fe'],
                borderColor: [/*'#dc3545',*/'#1976d2','#e1f5fe']
            }]
        },
        options: {
            responsive:true,
            aspectRatio: 4.1,
            legend:{
                display:true,
                position: 'right',
                labels:{
                    fontColor:'#bdbdbd'
                }
            }
        } 
    })
}

export { lastStateChartFn, lastOutcomesChartFn };