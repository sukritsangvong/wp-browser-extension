import { getPageCreationDate } from "./timeSeriesService.js";
import { injectGraphToPage, injectScaledCurrentGraphToPage } from "./graph.js";
import { fetchChangeWithHTML, fetchRevisionFromDate, getRevisionPageLink } from "./compareRevisionService.js";
import { HighlightType, HIGHLIGHT_TYPE } from "./enums";
import { markContent  } from "./markContent.js";
import { cleanText } from "./cleanText";

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
 * Get the title of a Wikipedia page by inspecting the html
 * @returns a string with title of a page
 */
const title = (() => {
    let titleSpan = document.getElementsByClassName("mw-page-title-main");
    if (titleSpan.length == 0) {
        let url = document.URL.split("/");
        return url[url.length - 1].replace("_", " ");
    } else {
        return titleSpan[0].innerHTML;
    }
})();

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
        injectScaledCurrentGraphToPage(duration);

        // remove hover effect from all scale buttons
        scaleButtonInputs.forEach((input) => {
            document.getElementById(input.id).classList.remove("buttonHoverEffect");
        });

        button.classList.add("buttonHoverEffect");
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

const updateClosestDate = (pageLink, oldRevisionDate) => {
    const revisionDate = document.getElementById("revisionDate");
    revisionDate.innerHTML = getRevisionToClosestDateText(pageLink, oldRevisionDate);
};

const getRevisionToClosestDateText = (pageLink, oldRevisionDate) => {
    return `Comparing the current Wikipedia page to the <a href=${pageLink} target="_blank">${oldRevisionDate} version</a> (the closest revision to your chosen time)`;
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
    highlightRevisionBetweenRevisionIds(title, curRevisionId, oldRevisionId);

    belowGraphDiv.innerHTML = `<div style="display: flex; flex-direction: row; justify-content: center;">
    <div class="flex-container" id="buttonContainer">
    <input type="text" pattern="\d{1,2}/\d{1,2}/\d{4}" class="datepicker" title="Please match the mm/dd/yyyy format" value="${initialDate
        .toLocaleDateString("en-US")
        .slice(0, 10)}" id="dateOutput" name="dateOutput" style="text-align: center;">
        <button class="highlightButton" id="highlightButton">Highlight Changes</button>
    </div>
    <div id="loader"></div>
    </div>
    <div style="padding-left: 3%; padding-top: 1%; text-align: center;">
        <div class="card">
            <div class="card-body" style="text-align: center;">
            <p class="card-text" id="revisionDate"> ${getRevisionToClosestDateText(
                getRevisionPageLink(title, curRevisionId, oldRevisionId).replace(/\s/g, "_"),
                oldRevisionDate
            )}</p>
            <p class="card-text"> Newly added texts are highlighted in green, but the deletions are not included </p>
            </div>
        </div>
    </div>`;
    belowGraphDiv.style.cssText = "text-align:center;";
    insertAfter(belowGraphDiv, viewsEditsChart);

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

        // Change the revision context box
        updateClosestDate(
            getRevisionPageLink(title, curRevisionId, oldRevisionId).replace(/\s/g, "_"),
            oldRevisionDate
        );

        highlightRevisionBetweenRevisionIds(title, curRevisionId, oldRevisionId);
    });
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
 * Once we have the Wikipedia's page creation date, we render items below graph
 */
getPageCreationDate(title).then((date) => {
    const promises = [];
    promises.push(renderGraphOverlay());
    promises.push(renderItemsBelowGraph(date));

    // Render popups only when graph and buttons are loaded
    Promise.all(promises).then(() => renderPopup());
});

/**
 *  Highlights the words that are given with context. Support for links,
 *  there are some edge cases that don't work yet (highlight is link + no link) or
 *  context and highlight are links. Loops through the DOM tree text nodes, and if no patial
 *  match, checks if it's a link (parent's siblings may contain the needed text)
 *  Note: Walker code idea and sample use (eg.: document.createTreeWalker and walker.nextNode())
 *  and the regex /[|=\[\]{}]+|<[^>]*>/g are courtesy of ChatGPT
 *
 * @param {dictionary} context dictionary entry with keys "content_before", "highlight" and "content_after"
 * @param {string} color of the highlight
 */
const highlightContentUsingNodes = (context, color) => {
    context.highlight = context.highlight.trim();

    let highlightSucceeded = false;

    if (context.highlight.length == 0) {
        // This will make it faster, it was picking up a lot of empty highlighting
        return highlightSucceeded;
    }

    let textNodes = [];
    let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    let newValue, node, parent;
    textNodes.every((textNode) => {
        node = textNode;
        parent = node.parentNode;
        let value = node.nodeValue;
        let filter_highlight = context.highlight.replace(/<ref>.*<\/ref>/g, "").replace(/\{\{Cite.*?\}\}/g, ""); 
        newValue = value.replace(
            filter_highlight,
            `<mark style='background-color: ${color}' class='extension-highlight'>${filter_highlight}</mark>`
        );
        if (newValue !== value) {
            // Clean up the context.content_after and context.content_before from wiki markup
            let content_after = context.content_after.replace(/[|=\[\]{}]+|<[^>]*>/g, "").replace("cite web", "");
            let content_before = context.content_before.replace(/[|=\[\]{}]+|<[^>]*>/g, "").replace("cite web", "");
            if (value.includes(content_after) || value.includes(content_before)) {
                // Or because of edge cases, if good context this will almost always work
                let newNode = document.createElement("span");
                newNode.innerHTML = newValue;
                parent.replaceChild(newNode, node);
                highlightSucceeded = true;
                return false;
            } else {
                // Maybe it is a link, check parent's previous and next siblings
                if (
                    node.parentNode != null &&
                    node.parentNode.nextSibling != null &&
                    node.parentNode.nextSibling.nodeValue != null &&
                    node.parentNode.previousSibling != null &&
                    node.parentNode.previousSibling.nodeValue != null &&
                    (node.parentNode.nextSibling.nodeValue.includes(content_after) ||
                        node.parentNode.previousSibling.nodeValue.includes(content_before))
                ) {
                    let newNode = document.createElement("span");
                    newNode.innerHTML = newValue;
                    parent.replaceChild(newNode, node);
                    highlightSucceeded = true;
                    return false;
                }

                // We can try matching with smaller context, as links or html may be further along blocking
                let short_content_after = content_after
                    .slice(0, Math.round(content_after.length * 0.1))
                    .replace("Cite news", "")
                    .trim();
                let short_content_before = content_before
                    .substring(Math.round(content_before.length * 0.9))
                    .replace("Cite news", "")
                    .trim();
                // As it is short context, we match both after and before for accuracy
                if (value.includes(short_content_after) && value.includes(short_content_before)) {
                    let newNode = document.createElement("span");
                    newNode.innerHTML = newValue;
                    parent.replaceChild(newNode, node);
                    highlightSucceeded = true;
                    return false;
                }
            }
        }
        return true;
    });
    return highlightSucceeded;
};

/** The page id can be found as the last part of the link to
 * the wikidata item on the left side of wikipedia pages.
 * If no page id is found throws an error.
 * @returns the page id of a Wikipedia page
 */
(() => {
    let wiki_data_url;
    try {
        wiki_data_url = document.getElementById("t-wikibase").getElementsByTagName("a")[0].href;
    } catch {
        throw new Error("Can't find page id!");
    }
    const wiki_page_id = wiki_data_url.split("/").slice(-1)[0];
    console.info({
        wiki_data_url: wiki_data_url,
        wiki_page_id: wiki_page_id,
    });
    return wiki_page_id;
})();

/**
 * Highlight the current page to a revision on a given date
 *
 * @param {string} title of the wikipedia page
 * @param {string} curRevisionId to highlight on
 * @param {string} oldRevisionId to compare reivion on curDate to
 */
const highlightRevisionBetweenRevisionIds = async (title, curRevisionId, oldRevisionId) => {
    try {
        highlight(curRevisionId, oldRevisionId);
    } catch (err) {
        console.error(
            `Error highlighting revisions between revition ids for inputs title:${title} curRevisionId:${curRevisionId} oldRevisionId:${oldRevisionId}\nError: ${err}`
        );
    }
};

/**
 * If there's a link in the text to highlight, it will split and update the context after and before
 * 
 * @param {dictionary} element dictionary entry with keys "content_before", "highlight" and "content_after"
 * @returns an array of dictionaries 
 */
const splitElementNode = (element) => {
    let result = [];
    if (element.highlight.includes("[[") && element.highlight.includes("]]")) {
        let split = element.highlight.split(/\[\[(.*?)\]\]/);
        for (let i = 0; i < split.length; i++) {
            result.push({
                content_before: i != 0 ? split[i-1] : "",
                highlight: split[i],
                content_after: i != (split.length-1) ? split[i+1] : "",
            });
        }
        return result;
    }
    return [element];
};

/**
 * Highlight a page by comparing two revisions
 *
 * @param {int} revisionId of the page that contains highlights
 * @param {int} oldRevisionId of the page to compare to
 */
const highlight = async (revisionId, oldRevisionId) => {
    const arr = await fetchChangeWithHTML(oldRevisionId, revisionId);
    if (HIGHLIGHT_TYPE == HighlightType.NODE) {
        const succeed = [];
        const fail = [];
        for(let element of arr) {
            let splitElement = splitElementNode(element);
            for (let subElement of splitElement) {
                subElement = cleanText(subElement);
                if (highlightContentUsingNodes(subElement, "#AFE1AF")) {
                    succeed.push(subElement);
                } else {
                    fail.push(subElement);
                }
            }
        }
    } else {
        markContent(arr, "#AFE1AF").then(({ succeed, fail }) => {});
    }
    let button = document.getElementById("highlightButton");
    button.disabled = false;
    document.getElementById("loader").style.display = "none";
};
