import { getPageCreationDate } from "./timeSeriesService.js";
import { injectGraphToPage, injectScaledCurrentGraphToPage, injectClickStreamGraphToPage} from "./graph.js";
import { debug_console, title } from "./globals.js";

/**
 * Inserts a new node after an existing node
 *
 * @param {HTMLElement} newNode
 * @param {HTMLElement} existingNode
 */
const insertAfter = (newNode, existingNode) => {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
};

/**
 * Creates the div for the graph overlay by first creating a container
 * then the child, which is the div for the graph. Resize the graph
 * div and make sure the site sub "From Wikipedia, the free encyclopedia"
 * is above the graph and below the title
 */
const renderGraphOverlay = async () => {
    let floatContainer = document.createElement("div");
    floatContainer.style.cssText = "display: flex; background-image: linear-gradient(white, rgb(239, 239, 239));";
    floatContainer.setAttribute("id", "floatContainer");

    let graphContainer = document.createElement("div");
    graphContainer.setAttribute("id", "graphOverlay");
    graphContainer.style.cssText = "text-align:center;width:100%;height:20%;";

    let canvas = document.createElement("canvas");
    canvas.style.maxHeight = "200px";
    canvas.id = "viewsEditsChart";

    graphContainer.appendChild(canvas);
    floatContainer.appendChild(graphContainer);
    let p = document.createElement("p");
    graphContainer.appendChild(p);

    const ctx = canvas.getContext("2d");
    let percentage = 0;
    let diff;

    const progressBar = () => {
        const {
            canvas: { width, height },
        } = ctx;

        const angle = Math.PI / 180;
        diff = ((percentage / 100) * angle * 360 * 10).toFixed(2);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgb(54, 162, 235)";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(`${percentage} %`, 0.425 * width, 0.525 * height);

        ctx.beginPath();
        const radius = height * 0.4;
        ctx.strokeStyle = "rgb(54, 162, 235)";
        ctx.lineWidth = 10;
        ctx.arc(width / 2, height / 2, radius, angle * 270, diff / 10 + angle * 270, false);
        ctx.stroke();

        if (percentage >= 86) {
            clearTimeout(sim);
        }
        percentage++;
    };

    const siteSub = document.getElementById("siteSub");
    insertAfter(floatContainer, siteSub);
    const sim = setInterval(progressBar, 3);

    const graphPromise = injectClickStreamGraphToPage(title, 5).then(async () => {
        document.getElementById("5").click();
        clearTimeout(sim);
    });

    renderScaleButtons();
    return graphPromise; // Promise of whether the graph is injected
};

const setUpScaleButton = (scaleButtonsDiv, buttonId, buttonText, count, scaleButtonInputs) => {
    const button = document.createElement("button");
    button.setAttribute("id", buttonId);
    button.setAttribute("style", "margin-right: 5px;");
    button.setAttribute("class", "extensionButton");
    button.innerHTML = buttonText;
    scaleButtonsDiv.appendChild(button);

    button.addEventListener("click", () => {
        // remove hover effect from all scale buttons
        scaleButtonInputs.forEach((input) => {
            document.getElementById(input.id).classList.remove("buttonHoverEffect");
        });

        button.classList.add("buttonHoverEffect");
        injectClickStreamGraphToPage(title, count);
    });
};

const setUpScaleButtons = (scaleButtonsDiv, scaleButtonInputs) => {
    scaleButtonInputs.forEach((input) => {
        setUpScaleButton(
            scaleButtonsDiv,
            input.id,
            input.name,
            input.count,
            scaleButtonInputs
        );
    });
};

/**
 * Render buttons to scale the graph.
 */
const renderScaleButtons = () => {
    const viewsEditsChart = document.getElementById("viewsEditsChart");
    const scaleButtonsDiv = document.createElement("div");
    scaleButtonsDiv.setAttribute("id", "scaleButtonsDiv");
    scaleButtonsDiv.setAttribute("style", "text-align: start;");

    const scaleButtonInputs = [
        { id: "5", name: "5", count: 5 },
        { id: "10", name: "10", count: 10 },
        { id: "25", name: "25", count: 25 },
    ];

    setUpScaleButtons(scaleButtonsDiv, scaleButtonInputs);

    // inserts buttons above graph
    viewsEditsChart.parentNode.insertBefore(scaleButtonsDiv, viewsEditsChart);
};

renderGraphOverlay();