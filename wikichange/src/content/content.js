import { getPageCreationDate } from "./timeSeriesService.js";
import { injectGraphToPage, injectScaledCurrentGraphToPage } from "./graph.js";
import { fetchChangeWithHTML, fetchRevisionFromDate, getRevisionPageLink } from "./compareRevisionService.js";
import { HighlightType, HIGHLIGHT_TYPE } from "./enums";
import { markContent  } from "./markContent.js";

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
    floatContainer.style.cssText = "display: flex;";
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
        document.getElementById("5y").click();
    });

    renderScaleButtons();
    return graphPromise; // Promise of whether the graph is injected
};

const setUpScaleButton = (scaleButtonsDiv, buttonId, buttonText, duration, scaleButtonInputs) => {
    const button = document.createElement("button");
    button.setAttribute("id", buttonId);
    button.setAttribute("style", "margin-right: 5px;");
    button.setAttribute("class", "extensionButton");
    button.innerHTML = buttonText;
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

const setUpScaleButtons = (scaleButtonsDiv, scaleButtonInputs) => {
    scaleButtonInputs.forEach((input) => {
        setUpScaleButton(scaleButtonsDiv, input.id, input.name, input.duration, scaleButtonInputs);
    });
};

const getDateObjectFromNow = (monthsFromCurrent) => {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsFromCurrent);
    return date;
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
        { id: "all", name: "ALL", duration: null }, // null represents shows everything
        { id: "5y", name: "5Y", duration: getDateObjectFromNow(5 * 12) },
        { id: "3y", name: "3Y", duration: getDateObjectFromNow(3 * 12) },
        { id: "1y", name: "1Y", duration: getDateObjectFromNow(12) },
        { id: "6m", name: "6M", duration: getDateObjectFromNow(6) },
        { id: "3m", name: "3M", duration: getDateObjectFromNow(3) },
    ];

    setUpScaleButtons(scaleButtonsDiv, scaleButtonInputs);

    // inserts buttons above graph
    viewsEditsChart.parentNode.insertBefore(scaleButtonsDiv, viewsEditsChart);
};

const getRevisionToClosestDateText = (pageLink, oldRevisionDate) => {
    return `Comparing the current Wikipedia page to the <a href=${pageLink} target="_blank">${oldRevisionDate} version</a> (the closest revision to your chosen time)`;
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
    initialDate.setDate(now.getDate() - totalDaysDiff * 0.5);

    let curRevisionId = (await fetchRevisionFromDate(title, now))[0];
    const oldRevision = await fetchRevisionFromDate(title, initialDate);
    let oldRevisionId = oldRevision[0];
    const oldRevisionDate = oldRevision[1].toLocaleDateString().slice(0, 10);
    highlightRevisionBetweenRevisionIds(title, curRevisionId, oldRevisionId);

    belowGraphDiv.innerHTML = `<input type="date" value="${initialDate
        .toISOString()
        .slice(0, 10)}" id="dateOutput" name="dateOutput" style="text-align: center;"> 
                                <button class="extensionButton" id="highlightButton">Highlight</button><div id="loader"></div>
                                <p></p>
                                <button class="extensionButton" id="revisionButton">Go To Revision Page</button>
                            <div style="padding-left: 3%; padding-top: 3%; text-align: center;">
                                <div class="card" style="border-style: solid;">
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
    renderLoader();

    const dateInput = document.getElementById("dateOutput");
    const highlightButton = document.getElementById("highlightButton");
    const revisionButton = document.getElementById("revisionButton");

    highlightButton.addEventListener("click", async () => {
        document.getElementById("loader").style.display = "inline-block";
        highlightButton.disabled = true;
        revisionButton.disabled = true; // disable until we get new set of revIds
        const date = new Date(dateInput.value);

        const oldHighlights = document.getElementsByClassName("extension-highlight");
        Array.from(oldHighlights).forEach((oldHighlights) => {
            oldHighlights.style.backgroundColor = "inherit";
            oldHighlights.style.color = "inherit";
        });

        // update revision ids
        curRevisionId = (await fetchRevisionFromDate(title, now))[0];
        const oldRevision = await fetchRevisionFromDate(title, date);
        oldRevisionId = oldRevision[0];
        const oldRevisionDate = oldRevision[1].toLocaleDateString().slice(0, 10);

        // Change the revision context box
        const revisionDate = document.getElementById("revisionDate");
        revisionDate.innerHTML = getRevisionToClosestDateText(
            getRevisionPageLink(title, curRevisionId, oldRevisionId).replace(/\s/g, "_"),
            oldRevisionDate
        );

        highlightRevisionBetweenRevisionIds(title, curRevisionId, oldRevisionId);
        revisionButton.disabled = false;
    });

    revisionButton.addEventListener("click", async () => {
        try {
            window.open(getRevisionPageLink(title, curRevisionId, oldRevisionId), "_blank");
        } catch (err) {
            console.error(
                `Error getting revision link between revision ids for inputs title:${title} curRevisionId:${curRevisionId} oldRevisionId:${oldRevisionId}\nError: ${err}`
            );
        }
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
 * Render a simple JS loader by the highlight button
 */
const renderLoader = () => {
    let button = document.getElementById("highlightButton");
    button.disabled = true;

    let loader = document.getElementById("loader");
    loader.style.border = "5px solid #f3f3f3";
    loader.style.borderTop = "5px solid #3498db";
    loader.style.borderRadius = "50%";
    loader.style.width = "15px";
    loader.style.height = "15px";
    loader.style.position = "absolute";
    loader.style.marginLeft = "4px";
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

    // Render popups only when graph and buttons are loaded
    Promise.all(promises).then(() => renderPopup());
});

// Get wikipedia text, global as we shouldn't get it every time we highlight a word
let wikiText = document.getElementById("mw-content-text");
let innerHTML = wikiText.innerHTML;

/**
 * Simple highlighter with no context. Highlights the first word that matches text
 *
 * @param {string} text that we want to highlight
 * @param {string} color of the highlighting
 */
const highlightContent = (text, color) => {
    let index = innerHTML.indexOf(text);
    if (index >= 0) {
        innerHTML =
            innerHTML.substring(0, index) +
            `<mark style='background-color: ${color}' class='extension-highlight'>` +
            innerHTML.substring(index, index + text.length) +
            "</mark>" +
            innerHTML.substring(index + text.length);
        wikiText.innerHTML = innerHTML;
    }
};

/**
 * Highlights the words that are given with context. No support for links
 * Loops through the page until it finds a match, does this based on indexes.
 *
 * @param {dictionary} json dictionary entry with keys "content_before", "highlight" and "content_after"
 * @param {string} color of the highlight
 */
const highlightContentWithContext = (json, color) => {
    let foundIndex = -1;
    let controlIndex = 0;
    let highlight = json["highlight"];
    let before = json["content_before"];
    let after = json["content_after"];
    while ((foundIndex = innerHTML.indexOf(highlight, controlIndex)) != -1) {
        let afterText = innerHTML.substring(
            foundIndex + highlight.length,
            foundIndex + highlight.length + after.length
        );
        let beforeText = innerHTML.substring(foundIndex - before.length, foundIndex);

        if (afterText === after && beforeText === before) {
            innerHTML =
                innerHTML.substring(0, foundIndex) +
                `<mark style='background-color: ${color}' class='extension-highlight'>` +
                innerHTML.substring(foundIndex, foundIndex + highlight.length) +
                "</mark>" +
                innerHTML.substring(foundIndex + highlight.length);
            wikiText.innerHTML = innerHTML;
            break;
        }
        controlIndex = foundIndex + highlight.length;
    }
};

/**
 * Will clean links. Works with links with different and same titles, for instance
 * [[text]] and [[text|text]] and return the clean version "text"
 * @param {string} text_with_link
 */
const returnCleanLink = (text_with_link) => {
    let pattern = /\[\[([^\|]+)\|?([^\]]+)\]\]/g;
    let result = text_with_link.replace(pattern, (_, p1, p2) => {
        return p2 || p1;
    });
    return result;
};

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
        if (context.highlight.includes("[[") && context.highlight.includes("]]")) {
            // This includes a link in the content it is supposed to highlight.
            // Will highlight only first sentence
            newValue = value.replace(
                filter_highlight,
                `<mark style='background-color: ${color}' class='extension-highlight'>${value}</mark>`
            );
        } else {
            newValue = value.replace(
                filter_highlight,
                `<mark style='background-color: ${color}' class='extension-highlight'>${filter_highlight}</mark>`
            );
        }

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
        for(let element of arr){
            if(highlightContentUsingNodes(element, "#AFE1AF")){
                succeed.push(element);
            } else {
                fail.push(element);
            }
        }
    } else {
        markContent(arr, "#AFE1AF").then(({ succeed, fail }) => {});
    }
    let button = document.getElementById("highlightButton");
    button.disabled = false;
    document.getElementById("loader").style.display = "none";
};
