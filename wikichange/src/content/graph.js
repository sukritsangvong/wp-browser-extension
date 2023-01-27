import Chart from "chart.js/auto";
import { getPageViewTimeseries, getPageRevisionCountTimeseries } from "./timeSeriesService.js";

const CHART_COLORS = {
    red: "rgb(255, 99, 132)",
    orange: "rgb(255, 159, 64)",
    yellow: "rgb(255, 205, 86)",
    green: "rgb(75, 192, 192)",
    blue: "rgb(54, 162, 235)",
    purple: "rgb(153, 102, 255)",
    grey: "rgb(201, 203, 207)",
};

let chart;

/**
 * Injects a graph of a given article's page views and edits data.
 *
 * @param {string} title of the article
 * @param {Date} startDate
 * @param {Date} endDate
 */
const injectGraphToPage = async (title, startDate, endDate) => {
    const pageViews = await getPageViewTimeseries(title, startDate, endDate);
    const revisions = await getPageRevisionCountTimeseries(title, startDate, endDate);

    const xLabels = pageViews["x"];

    const data = {
        labels: xLabels,
        datasets: [
            {
                label: "Views",
                data: pageViews["y"],
                borderColor: CHART_COLORS.grey,
                yAxisID: "y",
                borderWidth: 2,
            },
            {
                label: "Edits",
                data: revisions["y"],
                borderColor: CHART_COLORS.blue,
                yAxisID: "y1",
                borderWidth: 2,
            },
        ],
    };

    const config = {
        type: "line",
        data: data,
        options: {
            onClick: (e) => {
                let points = e.chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true)
                if (points.length) {
                    let firstPoint = points[0];
                    let date = e.chart.data.labels[firstPoint.index];
                    if (date) {
                        const slider = document.getElementById("graphSlider");
                        const dateInput = document.getElementById("dateOutput");
                    }
                }
            },
            plugins: {
                tooltip: {
                    position: 'nearest'
                }
            },
            scales: {
                y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    title: {
                        display: true,
                        text: "Views",
                    },
                },
                y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    title: {
                        display: true,
                        text: "Edits",
                    },
                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
            },
            elements: {
                point: {
                    radius: 0,
                },
            },
            interaction: {
                mode: 'nearest'
            }
        },
    };
    chart = new Chart(document.getElementById("viewsEditsChart"), config);
};

export default injectGraphToPage;
