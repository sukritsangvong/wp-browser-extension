import { getPageCreationDate } from "./timeSeriesService.js";
import injectGraphToPage from "./graph.js";
import { fetchChangeWithHTML, fetchRevisionFromDate, getRevisionPageLink } from "./compareRevisionService.js";

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
    let title = titleSpan[0].innerHTML;
    return title;
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
    graphContainer.setAttribute("text-align", "center");
    let canvas = document.createElement("canvas");
    canvas.style.maxHeight = "200px";
    canvas.id = "viewsEditsChart";
    graphContainer.style.cssText = "width:100%;height:20%;";
    graphContainer.appendChild(canvas);
    floatContainer.appendChild(graphContainer);

    let p = document.createElement("p");
    graphContainer.appendChild(p);

    const ctx = canvas.getContext('2d');
    let percentage = 0;
    let diff;
    
    function progressBar() {
        const { canvas: { width, height}} = ctx;
        const angle = Math.PI / 180;
        diff = ((percentage/100) * angle * 360 * 10).toFixed(2);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(54, 162, 235, 1)';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`${percentage} %`, width/2, height/2);

        ctx.beginPath();
        const radius = height*0.4;
        ctx.strokeStyle = 'rgba(54, 162, 235, 1)';
        ctx.lineWidth = 10;
        ctx.arc(width / 2, height /2, radius, angle *270, diff / 10 + angle *270, false);
        ctx.stroke();

        if (percentage >= 100) {
            clearTimeout(sim);
        } 
        percentage++;
    };
    let siteSub = document.getElementById("siteSub");
    insertAfter(floatContainer, siteSub);
    const creationDate = await getPageCreationDate(title);
    const sim = setInterval(progressBar, 2);
    injectGraphToPage(title, creationDate, new Date(Date.now()));
};

/**
 * Add slider and date input to container, below the graph. Slider and date input are connected
 * Equivalency between dates and integers: 0: today, 100: creation date
 * When slider changes, date input also changes, upon clicking highlight and closest revision date appears
 *
 * @param {Date} creationDate of a Wiki page
 */
const renderSlider = async (creationDate) => {
    let now = new Date();
    let totalDaysDiff = (now.getTime() - creationDate.getTime()) / (1000 * 3600 * 24);
    let viewsEditsChart = document.getElementById("viewsEditsChart");
    let sliderDiv = document.createElement("div");
    sliderDiv.setAttribute("id", "sliderDiv");
    let initialDate = new Date();
    initialDate.setDate(now.getDate() - totalDaysDiff * 0.5);

    let curRevisionId = (await fetchRevisionFromDate(title, now))[0];
    let oldRevisionId = (await fetchRevisionFromDate(title, initialDate))[0];
    console.log(fetchChangeWithHTML(curRevisionId, oldRevisionId));
    highlightRevisionBetweenRevisionIds(title, curRevisionId, oldRevisionId);

    sliderDiv.innerHTML = `<div style="padding-left:5%; direction: rtl;">  
                                <input type="range" id="graphSlider" value="50" min="0" max="100" style="width:90%;">  
                            </div>
                            <input type="date" value="${initialDate
                                .toISOString()
                                .slice(0, 10)}" id="dateOutput" name="dateOutput" style="text-align: center;"> 
                                <button id = "highlightButton">Highlight</button> <div id="loader"></div>
                                <p></p>
                                <div class="card" style="max-width: 100%;border-style: solid;">
                                    <div class="card-body">
                                    <p class="card-text" id="revisionContext"> Compared to the <a href=${(getRevisionPageLink(curRevisionId, oldRevisionId))} target="_blank">${(await fetchRevisionFromDate(title, initialDate))[1].toLocaleDateString().slice(0, 10)}</a> version, the current page has 30 differences highlight below</p>
                                    </div>
                                </div>`;
    sliderDiv.style.cssText = "text-align:center;";
    insertAfter(sliderDiv, viewsEditsChart);
    renderLoader();

    const slider = document.getElementById("graphSlider");
    const dateInput = document.getElementById("dateOutput");
    const highlightButton = document.getElementById("highlightButton");
    // const revisionButton = document.getElementById("revisionButton");

    slider.addEventListener("change", function (ev) {
        let numDays = parseInt((totalDaysDiff * this.value) / 100);
        let date = new Date();
        date.setDate(now.getDate() - numDays);
        dateInput.value = date.toISOString().slice(0, 10);
    });

    dateInput.addEventListener("change", function (ev) {
        let daysDiff = (new Date(this.value).getTime() - creationDate.getTime()) / (1000 * 3600 * 24);
        let sliderVal = 100 - (daysDiff / totalDaysDiff) * 100;
        slider.value = sliderVal;
    });

    highlightButton.addEventListener("click", async function (ev) {
        document.getElementById("loader").style.display = "inline-block";
        highlightButton.disabled = true;
        // revisionButton.disabled = true; // disable until we get new set of revIds
        const date = new Date(dateInput.value);

        const oldHighlights = document.getElementsByClassName("extension-highlight");
        Array.from(oldHighlights).forEach(function (oldHighlights) {
            oldHighlights.style.backgroundColor = "inherit";
            oldHighlights.style.color = "inherit";
        });

        // update revision ids
        curRevisionId = (await fetchRevisionFromDate(title, now))[0];
        oldRevisionId = (await fetchRevisionFromDate(title, date))[0];

        // Change the revision context box
        const revisionContext = document.getElementById("revisionContext");
        revisionContext.innerHTML = `Compared to the <a href=${(getRevisionPageLink(curRevisionId, oldRevisionId))} target="_blank">${(await fetchRevisionFromDate(title, date))[1].toLocaleDateString().slice(0, 10)}</a> version, the current page has 30 differences highlighted below`;
        highlightRevisionBetweenRevisionIds(title, curRevisionId, oldRevisionId);
        // revisionButton.disabled = false;
    });

    // revisionButton.addEventListener("click", async function (ev) {
    //     try {
    //         window.open(getRevisionPageLink(curRevisionId, oldRevisionId), "_blank");
    //     } catch (err) {
    //         console.error(
    //             `Error getting revision link between revision ids for inputs title:${title} curRevisionId:${curRevisionId} oldRevisionId:${oldRevisionId}\nError: ${err}`
    //         );
    //     }
    // });
};

renderGraphOverlay();

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
 * Once we have the Wikipedia's page creation date, we render the slider
 */
getPageCreationDate(title).then(function (date) {
    renderSlider(date);
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
 *  Highlights the words that are given with context. Support for links,
 *  there are some edge cases that don't work yet (highlight is link + no link) or
 *  context and highlight are links. Loops through the DOM tree text nodes, and if no patial
 *  match, checks if it's a link (parent's siblings may contain the needed text)
 *  Note: Walker code idea and sample use (eg.: document.createTreeWalker and walker.nextNode())
 *  is courtesy of ChatGPT
 *
 * @param {dictionary} context dictionary entry with keys "content_before", "highlight" and "content_after"
 * @param {string} color of the highlight
 */
const highlightContentUsingNodes = (context, color) => {
    context.highlight = context.highlight.trim();

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
        newValue = value.replace(
            context.highlight,
            `<mark style='background-color: ${color}' class='extension-highlight'>${context.highlight}</mark>`
        );

        if (newValue !== value) {
            if (value.includes(context.content_after) || value.includes(context.content_before)) {
                // Or because of edge cases, if good context this will almost always work
                let newNode = document.createElement("span");
                newNode.innerHTML = newValue;
                parent.replaceChild(newNode, node);
                return false;
            } else {
                // maybe it is a link, check parent's previous and next siblings
                if (
                    node.parentNode != null &&
                    node.parentNode.nextSibling != null &&
                    node.parentNode.nextSibling.nodeValue != null &&
                    node.parentNode.previousSibling != null &&
                    node.parentNode.previousSibling.nodeValue != null &&
                    (node.parentNode.nextSibling.nodeValue.includes(context.content_after) ||
                        node.parentNode.previousSibling.nodeValue.includes(context.content_before))
                ) {
                    let newNode = document.createElement("span");
                    newNode.innerHTML = newValue;
                    parent.replaceChild(newNode, node);
                    return false;
                }
            }
        }
        return true;
    });
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
 * Creates a text container with information about deletions side by side with the graph
 */
const renderDeleteAlert = () => {
    // <p id="revisionDate">Highlighting closest revision to <a href=${(getRevisionPageLink(curRevisionId, oldRevisionId))} target="_blank">
    // ${(await fetchRevisionFromDate(title, initialDate))[1].toLocaleDateString().slice(0, 10)}</a></p>
    let deleteContainer = document.createElement("div");
    deleteContainer.innerHTML = `<div class="card" style="max-width: 18rem;border-style: solid;padding: 0.5rem;float: left;">
                                    <div class="card-body">
                                    <p class="card-text">This article had deleted content not shown in this overlay</p>
                                    </div>
                                </div>`;
    deleteContainer.setAttribute("id", "deleteAlert");

    let sliderDiv = document.getElementById("sliderDiv");
    //sliderDiv.append(deleteContainer);
};

renderDeleteAlert();

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
    arr.forEach((element) => {
        highlightContentUsingNodes(element, "#AFE1AF");
    });
    let button = document.getElementById("highlightButton");
    button.disabled = false;
    document.getElementById("loader").style.display = "none";
};
