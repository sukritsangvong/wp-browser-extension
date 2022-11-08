import { WIKI_CREATION_DATE, AggregateType } from "./enums.js";
import { getPageViews } from "./timeSeriesService.js";

const insertAfter = (newNode, existingNode) => {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

/* Creates the div for the graph overlay. TODO: create the graph and render it here */
const renderGraphOverlay = () => {
    let floatContainer = document.createElement('div');
    floatContainer.style.cssText = 'display: flex;';
    floatContainer.setAttribute('id', 'floatContainer');

    let graphContainer = document.createElement('div');
    graphContainer.setAttribute('id', 'graphOverlay');

    let canvas = document.createElement('canvas');
    canvas.style.maxHeight = '200px';
    canvas.id = 'viewsEditsChart';
    graphContainer.style.cssText = 'width:50%;height:20%;';
    graphContainer.appendChild(canvas);

    floatContainer.appendChild(graphContainer);

    let p = document.createElement('p');
    graphContainer.appendChild(p);

    let siteSub = document.getElementById('siteSub');
    insertAfter(floatContainer, siteSub);
}

renderGraphOverlay();

// Get wikipedia text, global as we shouldn't get it every time we highlight a word 
let wikiText = document.getElementById('mw-content-text');
let innerHTML = wikiText.innerHTML;

/* Highlights the words that are given */
const highlightPersistentContent = (text, color) => {
    let index = innerHTML.indexOf(text);
    if (index >= 0) { 
        innerHTML = innerHTML.substring(0, index) + `<mark style='background-color: ${color}'>` + innerHTML.substring(index, index + text.length) + '</mark>' + innerHTML.substring(index + text.length);
        wikiText.innerHTML = innerHTML;
    }
}

/* The page id can be found as the last part of the link to
 * the wikidata item on the left side of wikipedia pages.
 * If no page id is found throws an error.
 */
(() => {
    let wiki_data_url;
    try {
        wiki_data_url = document.getElementById('t-wikibase').getElementsByTagName('a')[0].href;
    } catch {
        throw new Error("'Can't find page id!");
    }
    const wiki_page_id = wiki_data_url.split('/').slice(-1)[0];
    console.info({
        'wiki_data_url': wiki_data_url,
        'wiki_page_id': wiki_page_id
    });
    return(wiki_page_id);
})();

const renderDeleteAlert = (count) => {
    let deleteContainer = document.createElement('div');
    deleteContainer.innerHTML = `<div class="card" style="max-width: 18rem;border-style: solid;padding: 0.5rem;float: left;">
                                    <div class="card-body">
                                    <h5 class="card-title">Deletions</h5>
                                    <p class="card-text">This article had ` + count + ` bytes of deleted content not shown in this overlay</p>
                                    </div>
                                </div>`;
    deleteContainer.setAttribute('id', 'deleteAlert');
    deleteContainer.style.cssText = 'padding:2.5%;';

    let floatContainer = document.getElementById('floatContainer');
    floatContainer.append(deleteContainer);
}

renderDeleteAlert(100);