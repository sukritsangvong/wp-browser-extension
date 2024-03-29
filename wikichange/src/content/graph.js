import Chart from "chart.js/auto";
import { getPageViewTimeseries, getPageRevisionCountTimeseries } from "./timeSeriesService.js";
import { debug_console } from "./globals.js";

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
    return new Promise((resolve) => setTimeout(resolve, time));
};

let pageViews = null;
let revisions = null;
let currentChart = null;

const updateDateSelector = (newDate) => {
    const dateSelector = document.getElementById("dateOutput");
    dateSelector.value = newDate.toLocaleDateString("en-US");
};

const formatDatesIntoShortMonthAndYear = (dates) =>
    dates.map(
        (date) =>
            `${date.toLocaleString("en-US", { month: "short" })} ${(date.getYear() > 99
                ? date.getYear() - 100
                : date.getYear()
            )
                .toString()
                .padStart(2, "0")}`
    );

const formatDatesIntoDateAndShortMonth = (dates) =>
    dates.map(
        (date) => `${date.getUTCDate().toString().padStart(2, "0")} ${date.toLocaleString("en-US", { month: "short" })}`
    );

const isSixMonthOrThreeMonthSelected = () => {
    return (
        document.getElementById("6m").classList.contains("buttonHoverEffect") ||
        document.getElementById("3m").classList.contains("buttonHoverEffect")
    );
};

const makePageViewAndReivisionGraphFromData = (pageViewsData, revisionsData) => {
    const xDates = pageViewsData["x"];
    const xLabels = isSixMonthOrThreeMonthSelected()
        ? formatDatesIntoDateAndShortMonth(xDates)
        : formatDatesIntoShortMonthAndYear(xDates);

    const pageViewsY = pageViewsData["y"];
    const pageRevisionsY = revisionsData["y"];

    const ctx = document.getElementById("viewsEditsChart");
    const data = {
        labels: xLabels,
        datasets: [
            {
                label: "Views",
                data: pageViewsY,
                borderColor: "#a9a9a9",
                backgroundColor: "#a9a9a9",
                yAxisID: "y",
                borderWidth: 2,
            },
            {
                label: "Edits",
                data: pageRevisionsY,
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
            onClick: (e) => {
                const dataIndex = e.chart.tooltip.dataPoints[0].dataIndex;
                const date = xDates[dataIndex];
                updateDateSelector(date);
                const highlightButton = document.getElementById("highlightButton");
                highlightButton.classList.add("wiggleAnimation");
                delay(500).then(() => highlightButton.classList.remove("wiggleAnimation"));
            },
            plugins: {
                tooltip: {
                    position: "nearest",
                    callbacks: {
                        title: (titleObj) => {
                            const dataIndex = titleObj[0].dataIndex;
                            return xDates[dataIndex].toLocaleDateString("en-US");
                        },
                    },
                },
                legend: {
                    onClick: null,
                },
            },
            scales: {
                x: {
                    ticks: {
                        callback: function (val, index) {
                            return index % 4 === 0 ? this.getLabelForValue(val) : "";
                        },
                        color: "grey",
                    },
                },
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

    currentChart = new Chart(ctx, config);
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
    const filteredX = graphData.x.filter((date) => date >= startDate);
    const filteredY = graphData.y.filter((_, i) => filteredX.indexOf(graphData.x[i]) !== -1);
    return { x: filteredX, y: filteredY };
};

const injectScaledCurrentGraphToPage = (startDate) => {
    if (pageViews == null || revisions == null || currentChart == null) {
        debug_console?.error("Error injecting scaled current graph to page because a graph has not been initialized.");
    }

    currentChart.destroy();

    // restore to unscaled graph
    if (startDate == null) {
        makePageViewAndReivisionGraphFromData(pageViews, revisions);
    } else {
        const filteredPageViews = getFilterGraphDataThatComeAfterStartDate(pageViews, startDate);
        const filteredRevisions = getFilterGraphDataThatComeAfterStartDate(revisions, startDate);

        makePageViewAndReivisionGraphFromData(filteredPageViews, filteredRevisions);
    }
};

export { injectGraphToPage, injectScaledCurrentGraphToPage };
