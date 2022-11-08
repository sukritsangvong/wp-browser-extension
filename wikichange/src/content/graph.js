import Chart from 'chart.js/auto';

const CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

/* Creates the div for the graph overlay. TODO: create the graph and render it here */
let renderGraphOverlay = () => {
    let graphContainer = document.createElement('div');
    let canvas = document.createElement('canvas');
    canvas.style.maxHeight = '150px';
    canvas.id = 'myChart';
    graphContainer.appendChild(canvas);

    let siteSub = document.getElementById('siteSub');
    siteSub.append(graphContainer);
}

renderGraphOverlay();

const labels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
];

const data = {
    labels: labels,
    datasets: [
        {
            label: 'Dataset 1',
            data: [0, 10, 5, 2, 20, 30, 45],
            borderColor: CHART_COLORS.red,
            yAxisID: 'y',
        },
        {
            label: 'Dataset 2',
            data: [10, 1, 34, 24, 17, 55, 45],
            borderColor: CHART_COLORS.blue,
            yAxisID: 'y1',
        }
    ]
};

const config = {
    type: 'line',
    data: data,
    options: {
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Views'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Edits',
                },
                // grid line settings
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
            }
        }
    }
};

const myChart = new Chart(
    document.getElementById('myChart'),
    config
);