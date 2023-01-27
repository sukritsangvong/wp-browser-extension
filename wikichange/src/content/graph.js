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

let pageViews = null;
let revisions = null;
let currentChart = null;

const makePageViewAndReivisionGraphFromData = (pageViewsData, revisionsData) => {
    const xLabels = pageViewsData["x"];

    const data = {
        labels: xLabels,
        datasets: [
            {
                label: "Views",
                data: pageViewsData["y"],
                borderColor: CHART_COLORS.grey,
                yAxisID: "y",
                borderWidth: 2,
            },
            {
                label: "Edits",
                data: revisionsData["y"],
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
                let points = e.chart.getElementsAtEventForMode(e, "nearest", { intersect: true }, true);
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
                    position: "nearest",
                },
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
                mode: "nearest",
            },
        },
    };

    currentChart = new Chart(document.getElementById("viewsEditsChart"), config);
};

/**
 * Injects a graph of a given article's page views and edits data.
 *
 * @param {string} title of the article
 * @param {Date} startDate
 * @param {Date} endDate
 */
const injectGraphToPage = async (title, startDate, endDate) => {
    pageViews = await getPageViewTimeseries(title, startDate, endDate);
    revisions = await getPageRevisionCountTimeseries(title, startDate, endDate);

    makePageViewAndReivisionGraphFromData(pageViews, revisions);
};

/**
 * Filters out data that come after a given date.
 *
 * @param {map} graphData of views and revisions that is used to create Chart.js graph
 * @param {Date} startDate to filter only instances that come after this date. if null, restore the unscaled graph.
 * @returns a Chart.js graph of views and revisions
 */
const getFilterGraphDataThatComeAfterStartDate = (graphData, startDate) => {
    const filteredX = graphData.x.filter((date) => new Date(date) >= startDate);
    const filteredY = graphData.y.filter((_, i) => filteredX.indexOf(graphData.x[i]) !== -1);
    return { x: filteredX, y: filteredY };
};

const injectScaledCurrentGraphToPage = (startDate) => {
    if (pageViews == null || revisions == null || currentChart == null) {
        console.error("Error injecting scaled current graph to page because a graph has not been initialized.");
    }

    currentChart.destroy();

    // restore to unscaled graph
    if (startDate == null) {
        makePageViewAndReivisionGraphFromData(pageViews, revisions);
    }

    const filteredPageViews = getFilterGraphDataThatComeAfterStartDate(pageViews, startDate);
    const filteredRevisions = getFilterGraphDataThatComeAfterStartDate(revisions, startDate);

    makePageViewAndReivisionGraphFromData(filteredPageViews, filteredRevisions);
};

export { injectGraphToPage, injectScaledCurrentGraphToPage };
