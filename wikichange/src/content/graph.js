import Chart from "chart.js/auto";
import {SankeyController, Flow} from 'chartjs-chart-sankey';

Chart.register(SankeyController, Flow);
import {fetchClickStreamFrom, fetchClickStreamTo} from "./clickStreamService.js"

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

let currentChart = null;

const injectClickStreamGraphToPage = async (title, count) => {
    const clickStreamDataFrom = await fetchClickStreamFrom(title.replace(" ", "_"), count);
    const clickStreamDataTo = await fetchClickStreamTo(title.replace(" ", "_"), count);
    const clickStreamData = [];
    clickStreamDataFrom["most_start"].map(x => clickStreamData.push({from: x[0], to: title, flow: x[1]}));
    clickStreamDataTo["most_end"].map(x => clickStreamData.push({from: title, to: x[0] + ' ', flow: x[1]}));
    console.log(clickStreamData);
    createGraphFromClickData(clickStreamData);
};

const createGraphFromClickData = (clickStreamData) => {
    const ctx = document.getElementById("viewsEditsChart");
    if (currentChart != null) {
      currentChart.destroy();
    }
    var colors = {
        0: "red",
        1: "orange",
        2: "yellow",
        3: "blue",
        4: "purple"
    };
    
    currentChart = new Chart(ctx, {
        type: "sankey",
        data: {
          datasets: [
            {
              data: clickStreamData,
              colorFrom: (c) => colors[c.dataIndex%5],
              colorTo: (c) => colors[c.dataIndex%5],
              colorMode: 'gradient',
              borderWidth: 2,
              borderColor: 'black'
            }
          ]
        }
      });
};

export { injectClickStreamGraphToPage};
