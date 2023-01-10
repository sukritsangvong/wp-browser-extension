import { getPageCreationDate } from "./timeSeriesService.js";
import injectGraphToPage from "./graph.js";
import { fetchChangeWithHTML, fetchRevisionFromDate } from "./compareRevisionService.js";

const insertAfter = (newNode, existingNode) => {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
};

/* Get the title of a Wikipedia page by inspecting the html */
const title = (() => {
    let titleSpan = document.getElementsByClassName("mw-page-title-main");
    let title = titleSpan[0].innerHTML;
    return title;
})();

/* Creates the div for the graph overlay. */
const renderGraphOverlay = async () => {
    let floatContainer = document.createElement("div");
    floatContainer.style.cssText = "display: flex;";
    floatContainer.setAttribute("id", "floatContainer");

    let graphContainer = document.createElement("div");
    graphContainer.setAttribute("id", "graphOverlay");

    let canvas = document.createElement("canvas");
    canvas.style.maxHeight = "200px";
    canvas.id = "viewsEditsChart";
    graphContainer.style.cssText = "width:75%;height:20%;";
    graphContainer.appendChild(canvas);

    floatContainer.appendChild(graphContainer);

    let p = document.createElement("p");
    graphContainer.appendChild(p);

    let siteSub = document.getElementById("siteSub");
    insertAfter(floatContainer, siteSub);
    const creationDate = await getPageCreationDate();
    injectGraphToPage(title, creationDate, new Date(Date.now()));
};

/* Add simple slider to graph. Equivalency between dates and integers: 0: today, 100: creation date */
const renderSlider = async (creationDate) => {
    let now = new Date();
    let totalDaysDiff = (now.getTime() - creationDate.getTime()) / (1000 * 3600 * 24);
    let viewsEditsChart = document.getElementById("viewsEditsChart");
    let sliderDiv = document.createElement("div");
    let initialDate = new Date();
    initialDate.setDate(now.getDate() - totalDaysDiff * 0.5);

    highlightRevisionBetweenDates(title, now, initialDate);

    sliderDiv.innerHTML = `<div style="direction: rtl">${now.toISOString().slice(0, 10)}  
                                <input type="range" id="graphSlider" value="50" min="0" max="100" style="width:60%;">  
                                ${creationDate.toISOString().slice(0, 10)}
                            </div>
                            <br/><input type="date" value="${initialDate
                                .toISOString()
                                .slice(0, 10)}" id="dateOutput" name="dateOutput" style="text-align: center;"> 
                                <button id = "highlightButton">Highlight</button><p id="revisionDate">Showing highlight for closest revision (<b>date: <span id="closesRev">
                                ${(await fetchRevisionFromDate(title, initialDate))[1].slice(0, 10)}</span></b>)</p>`;
    sliderDiv.style.cssText = "text-align:center;";
    insertAfter(sliderDiv, viewsEditsChart);

    let slider = document.getElementById("graphSlider");
    let dateInput = document.getElementById("dateOutput");
    let button = document.getElementById("highlightButton");

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

    button.addEventListener("click", async function (ev) {
        let spanClosestRev = document.getElementById("closesRev");
        let date = new Date(dateInput.value);
        spanClosestRev.innerHTML = (await fetchRevisionFromDate(title, date))[1].slice(0, 10);

        highlightRevisionBetweenDates(title, now, date);
    });
};

renderGraphOverlay();
getPageCreationDate(title).then(function (date) {
    renderSlider(date);
});

// Get wikipedia text, global as we shouldn't get it every time we highlight a word
let wikiText = document.getElementById("mw-content-text");
let innerHTML = wikiText.innerHTML;

/* Highlights the words that are given */
const highlightContent = (text, color) => {
    let index = innerHTML.indexOf(text);
    if (index >= 0) {
        innerHTML =
            innerHTML.substring(0, index) +
            `<mark style='background-color: ${color}'>` +
            innerHTML.substring(index, index + text.length) +
            "</mark>" +
            innerHTML.substring(index + text.length);
        wikiText.innerHTML = innerHTML;
    }
};

/* Highlights the words that are given with context. No support for links yet */
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
        console.log("After " + afterText);
        console.log("Before " + beforeText);
        if (afterText === after && beforeText === before) {
            innerHTML =
                innerHTML.substring(0, foundIndex) +
                `<mark style='background-color: ${color}'>` +
                innerHTML.substring(foundIndex, foundIndex + highlight.length) +
                "</mark>" +
                innerHTML.substring(foundIndex + highlight.length);
            wikiText.innerHTML = innerHTML;
            break;
        }
        controlIndex = foundIndex + highlight.length;
    }
};

/* Highlights the words that are given with context. Support for links, 
there are some edge cases that don't work yet (highlight is link + no link) or 
context and highlight are links 
Note: Walker code idea and sample use (eg.: document.createTreeWalker and walker.nextNode()) 
is courtesy of ChatGPT */
const highlightContentUsingNodes = (context, color) => {
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
            `<mark style='background-color: ${color}'>${context.highlight}</mark>`
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

/* The page id can be found as the last part of the link to
 * the wikidata item on the left side of wikipedia pages.
 * If no page id is found throws an error.
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

const renderDeleteAlert = () => {
    let deleteContainer = document.createElement("div");
    deleteContainer.innerHTML =
        `<div class="card" style="max-width: 18rem;border-style: solid;padding: 0.5rem;float: left;">
                                    <div class="card-body">
                                    <h5 class="card-title">Deletions</h5>
                                    <p class="card-text">This article had deleted content not shown in this overlay</p>
                                    </div>
                                </div>`;
    deleteContainer.setAttribute("id", "deleteAlert");
    deleteContainer.style.cssText = "padding:2.5%;";

    let floatContainer = document.getElementById("floatContainer");
    floatContainer.append(deleteContainer);
};

renderDeleteAlert();

/**
 * Highlight the current page to a revision on a given date
 *
 * @param {string} title of the wikipedia page
 * @param {Date} curDate to highlight on
 * @param {Date} oldDate to compare reivion on curDate to
 */
const highlightRevisionBetweenDates = async (title, curDate, oldDate) => {
    const curRevisionId = (await fetchRevisionFromDate(title, curDate))[0];
    const oldRevisionId = (await fetchRevisionFromDate(title, oldDate))[0];
    try {
        highlight(curRevisionId, oldRevisionId);
    } catch (err) {
        console.error(
            `Error highlighting revisions between dates for inputs title:${title} curDate:${curDate} oldDate:${oldDate}\nError: ${err}`
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
        console.log(element);
        highlightContentUsingNodes(element, "#AFE1AF");
    });
};
