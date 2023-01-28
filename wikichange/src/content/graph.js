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

/**
 * 
 * @param {*} time in milliseconds
 * @returns a promise that will delay
 */
const delay = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
}

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

    const ctx = document.getElementById("viewsEditsChart");

    const data = {
        labels: xLabels,
        datasets: [
            {
                label: "Views",
                data: pageViews["y"],
                borderColor: "#a9a9a9",
                backgroundColor: "#a9a9a9",
                yAxisID: "y",
                borderWidth: 2,
            },
            {
                label: "Edits",
                data: revisions["y"],
                borderColor: CHART_COLORS.blue,
                backgroundColor: CHART_COLORS.blue,
                yAxisID: "y1",
                borderWidth: 2,
            },
        ],
    };

    const config = {
        plugins: [
            {
                afterDraw: (chart) => {
                    if (chart.tooltip?._active?.length) {
                        let x = chart.tooltip._active[0].element.x;
                        let yAxis = chart.scales.y;
                        let ctx = chart.ctx;
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x, yAxis.top);
                        ctx.lineTo(x, yAxis.bottom);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "#FF69B4";
                        ctx.stroke();
                        ctx.restore();
                    }
                },
            },
        ],
        type: "line",
        data: data,
        options: {
            onClick: () => {
                const highlightButton = document.getElementById("highlightButton");
                let original_font = highlightButton.style.fontSize;
                highlightButton.style.fontSize = "130%";
                delay(1000).then(() => highlightButton.style.fontSize = original_font);
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
                intersect: false,
                mode: "index",
            },
            spanGaps: true,
        },
    };

    new Chart(ctx, config);
};

export default injectGraphToPage;
