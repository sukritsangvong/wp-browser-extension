import { getPageCreationDate } from "./timeSeriesService.js";
import { injectGraphToPage, injectScaledCurrentGraphToPage } from "./graph.js";
import { fetchChangeWithHTML, fetchRevisionFromDate, getRevisionPageLink } from "./compareRevisionService.js";
import { HighlightType, HIGHLIGHT_TYPE } from "./enums";
import { markContent } from "./markContent.js";
import { cleanText, splitElementNode } from "./cleanText";
import { debug_console, title } from "./globals.js";
import { highlightContentUsingNodes } from "./highlightNode";

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
    const creationDate = await getPageCreationDate(title);
    const sim = setInterval(progressBar, 3);

    const graphPromise = injectGraphToPage(title, creationDate, new Date(Date.now())).then(async () => {
        if (document.getElementById("5y").disabled) {
            document.getElementById("all").click();
        } else {
            document.getElementById("5y").click();
        }
        clearTimeout(sim);
    });

    renderScaleButtons(creationDate);
    return graphPromise; // Promise of whether the graph is injected
};

const setUpScaleButton = (scaleButtonsDiv, buttonId, buttonText, duration, scaleButtonInputs, isDisable) => {
    const button = document.createElement("button");
    button.setAttribute("id", buttonId);
    button.setAttribute("style", "margin-right: 5px;");
    button.setAttribute("class", "extensionButton");
    button.innerHTML = buttonText;
    button.disabled = isDisable;
    scaleButtonsDiv.appendChild(button);

    button.addEventListener("click", () => {
        // remove hover effect from all scale buttons
        scaleButtonInputs.forEach((input) => {
            document.getElementById(input.id).classList.remove("buttonHoverEffect");
        });

        button.classList.add("buttonHoverEffect");
        injectScaledCurrentGraphToPage(duration);
    });
};

const getDateObjectFromNow = (monthsFromCurrent) => {
    if (monthsFromCurrent == null) {
        return null;
    }
    const date = new Date();
    date.setMonth(date.getMonth() - monthsFromCurrent);
    return date;
};

const setUpScaleButtons = (scaleButtonsDiv, scaleButtonInputs, creationDate) => {
    const pageAgeInMonths = (new Date().getTime() - creationDate.getTime()) / (1000 * 3600 * 24 * 30);
    scaleButtonInputs.forEach((input) => {
        setUpScaleButton(
            scaleButtonsDiv,
            input.id,
            input.name,
            getDateObjectFromNow(input.duration),
            scaleButtonInputs,
            input.duration && pageAgeInMonths < input.duration
        );
    });
};

/**
 * Render buttons to scale the graph.
 */
const renderScaleButtons = (creationDate) => {
    const viewsEditsChart = document.getElementById("viewsEditsChart");
    const scaleButtonsDiv = document.createElement("div");
    scaleButtonsDiv.setAttribute("id", "scaleButtonsDiv");
    scaleButtonsDiv.setAttribute("style", "text-align: start;");

    const scaleButtonInputs = [
        { id: "all", name: "ALL", duration: null }, // null represents shows everything
        { id: "5y", name: "5Y", duration: 5 * 12 },
        { id: "3y", name: "3Y", duration: 3 * 12 },
        { id: "1y", name: "1Y", duration: 12 },
        { id: "6m", name: "6M", duration: 6 },
        { id: "3m", name: "3M", duration: 3 },
    ];

    setUpScaleButtons(scaleButtonsDiv, scaleButtonInputs, creationDate);

    // inserts buttons above graph
    viewsEditsChart.parentNode.insertBefore(scaleButtonsDiv, viewsEditsChart);
};

const getRevisionToClosestDateText = (pageLink, oldRevisionDate) => {
    return `<a href=${pageLink} target="_blank">${oldRevisionDate}</a> (the closest revision to your chosen time)`;
};

const getCurAndOldRevisionsParallel = async (title, curDate, oldDate) => {
    const revisionPromises = [fetchRevisionFromDate(title, curDate), fetchRevisionFromDate(title, oldDate)];
    return Promise.all(revisionPromises);
};

/**
 * Add date input and buttons, below the graph. Upon clicking highlight and closest revision date appears
 *
 * @param {Date} creationDate of a Wiki page
 */
const renderItemsBelowGraph = async (creationDate) => {
    let now = new Date();
    let totalDaysDiff = (now.getTime() - creationDate.getTime()) / (1000 * 3600 * 24);
    let viewsEditsChart = document.getElementById("viewsEditsChart");
    let belowGraphDiv = document.createElement("div");
    belowGraphDiv.setAttribute("id", "belowGraphDiv");
    let initialDate = new Date();

    // set to half on small page, else set to 2.5 years
    if (totalDaysDiff < 365 * 5) {
        initialDate.setDate(now.getDate() - totalDaysDiff * 0.5);
    } else {
        initialDate.setDate(now.getDate() - 365 * 2.5);
    }

    const revisions = await getCurAndOldRevisionsParallel(title, now, initialDate);
    let curRevisionId = revisions[0][0];
    const oldRevision = revisions[1];
    let oldRevisionId = oldRevision[0];
    const oldRevisionDate = oldRevision[1].toLocaleDateString("en-US").slice(0, 10);

    belowGraphDiv.innerHTML = `<div style="display: flex; flex-direction: row; justify-content: center;">
        <div class="flex-container" id="buttonContainer">
            <input type="text" pattern="\d{1,2}/\d{1,2}/\d{4}" class="datepicker" title="Please match the mm/dd/yyyy format" value="${initialDate
                .toLocaleDateString("en-US")
                .slice(0, 10)}" id="dateOutput" name="dateOutput" style="text-align: center;" />
            <button class="highlightButton" id="highlightButton">Highlight Changes</button>
        </div>
        <div id="loader"></div>
    </div>
    <div style="padding-left: 3%; padding-right: 3%; padding-top: 1%; text-align: center;">
        <p class="card-text" id="revisionDate"></p>
    </div>`;
    belowGraphDiv.style.cssText = "text-align:center;";
    insertAfter(belowGraphDiv, viewsEditsChart);
    renderLoader();
    const dateInput = document.getElementById("dateOutput");
    const highlightButton = document.getElementById("highlightButton");

    highlightButton.addEventListener("click", async () => {
        document.getElementById("loader").style.display = "inline-block";
        highlightButton.disabled = true;
        const date = new Date(dateInput.value);

        const oldHighlights = document.getElementsByClassName("extension-highlight");
        Array.from(oldHighlights).forEach((oldHighlights) => {
            oldHighlights.style.backgroundColor = "inherit";
            oldHighlights.style.color = "inherit";
        });

        // update revision ids
        const revisions = await getCurAndOldRevisionsParallel(title, now, date);
        let curRevisionId = revisions[0][0];
        const oldRevision = revisions[1];
        let oldRevisionId = oldRevision[0];
        const oldRevisionDate = oldRevision[1].toLocaleDateString("en-US").slice(0, 10);

        highlightRevisionBetweenRevisionIds(title, curRevisionId, oldRevisionId, oldRevisionDate);
    });
    return [curRevisionId, oldRevisionId, oldRevisionDate];
};

const toggleShowOnPopup = () => {
    document.getElementById("graphPopup").classList.toggle("show");
};

const renderPopup = () => {
    const popupDiv = document.createElement("div");
    popupDiv.setAttribute("id", "popupDiv");
    popupDiv.setAttribute("class", "popup");
    popupDiv.innerHTML = `<span class="popuptext" id="graphPopup">Clicking on the graph will change the date in this box!</span>`;

    const dateOutput = document.getElementById("dateOutput");
    dateOutput.parentNode.insertBefore(popupDiv, dateOutput);

    toggleShowOnPopup();

    let hasUnshown = false;
    popupDiv.addEventListener("mouseover", () => {
        toggleShowOnPopup();
        hasUnshown = true;
    });

    // disable popup after 10 seconds
    new Promise((resolve) => setTimeout(resolve, 10000)).then(() => {
        if (!hasUnshown) {
            toggleShowOnPopup();
        }
    });
};

/**
 * Render a simple JS loader by the highlight button
 */
const renderLoader = () => {
    let button = document.getElementById("highlightButton");
    button.disabled = true;

    let loader = document.getElementById("loader");
    loader.style.border = "5px solid white";
    loader.style.borderTop = "5px solid #3498db";
    loader.style.borderRadius = "100%";
    loader.style.width = "15px";
    loader.style.height = "15px";
    loader.style.position = "absolute";
    loader.style.marginTop = "6.5px";
    loader.style.marginLeft = "335px";
    loader.style.display = "inline-block";
    loader.style.animation = "spin 2s linear infinite";

    let keyframes = `@keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }`;
    let style = document.createElement("style");
    style.innerHTML = keyframes;
    document.head.appendChild(style);
};

/**
 * Once we have the Wikipedia's page creation date, we render items below graph
 */
getPageCreationDate(title).then((date) => {
    const promises = [];
    promises.push(renderGraphOverlay());
    promises.push(renderItemsBelowGraph(date));

    // Render popups and initial highlight only when graph and buttons are loaded
    Promise.all(promises).then(([, [curRevisionId, oldRevisionId, oldRevisionDate]]) => {
        renderPopup();
        highlightRevisionBetweenRevisionIds(title, curRevisionId, oldRevisionId, oldRevisionDate);
    });
});

/**
 * Highlight the current page to a revision on a given date
 *
 * @param {string} title of the wikipedia page
 * @param {string} curRevisionId to highlight on
 * @param {string} oldRevisionId to compare reivion on curDate to
 */
const highlightRevisionBetweenRevisionIds = async (title, curRevisionId, oldRevisionId, oldRevisionDate) => {
    try {
        highlight(curRevisionId, oldRevisionId).then((found_count) => {
            const new_text = `We highlighted <span style="color: #468946; font-weight: 700;">${found_count}</span> changes which represent additions to the page between ${getRevisionToClosestDateText(
                getRevisionPageLink(title, curRevisionId, oldRevisionId).replace(/\s/g, "_"),
                oldRevisionDate
            )} and the present day. Some of the changes were purely formatting or deletions and, therefore, are not highlighted.`;
            document.getElementById("revisionDate").innerHTML = new_text;
        });
    } catch (err) {
        debug_console?.error(
            `Error highlighting revisions between revition ids for inputs title:${title} curRevisionId:${curRevisionId} oldRevisionId:${oldRevisionId}\nError: ${err}`
        );
    }
};

/**
 * Highlight a page by comparing two revisions
 *
 * @param {int} revisionId of the page that contains highlights
 * @param {int} oldRevisionId of the page to compare to
 */
const highlight = async (revisionId, oldRevisionId) => {
    const arr = await fetchChangeWithHTML(oldRevisionId, revisionId);
    debug_console?.info(arr);
    const _succeed = [];
    const _fail = [];
    if (HIGHLIGHT_TYPE == HighlightType.NODE) {
        for (let element of arr) {
            let splitElement = splitElementNode(element);
            for (let subElement of splitElement) {
                subElement = cleanText(subElement);
                if (highlightContentUsingNodes(subElement, "#AFE1AF")) {
                    _succeed.push(subElement);
                } else {
                    _fail.push(subElement);
                }
            }
        }
    } else {
        await markContent(arr, "#AFE1AF").then(({ succeed, fail }) => {
            _succeed.push(...succeed);
            _fail.push(...fail);
        });
    }
    let button = document.getElementById("highlightButton");
    button.disabled = false;
    document.getElementById("loader").style.display = "none";
    debug_console?.groupCollapsed("found");
    debug_console?.log(_succeed);
    debug_console?.groupEnd();
    debug_console?.groupCollapsed("not-found");
    debug_console?.log(_fail);
    debug_console?.groupEnd();
    return _succeed.length;
};