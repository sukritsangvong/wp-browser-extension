import { WIKI_CREATION_DATE, AggregateType } from "./enums.js";
import { getPageViews } from "./timeSeriesService.js";

/* Creates the div for the graph overlay. TODO: create the graph and render it here */
const renderGraphOverlay = () => {
    let graphContainer = document.createElement('div');
    graphContainer.style.cssText = 'width:40%;height:180px;background-color:#E3C2FF;';

    let p = document.createElement('p');
    graphContainer.appendChild(p);
    let text = document.createTextNode('The graph overlay will be here');
    p.appendChild(text);

    let siteSub = document.getElementById('siteSub');
    siteSub.append(graphContainer);
}

// Get wikipedia text, global as we shouldn't get it every time we highlight a word 
let wikiText = document.getElementById('mw-content-text');
let innerHTML = wikiText.innerHTML;

/* Highlights the words that are given */
const highlightPersistentContent = (text, color) => {
    let index = innerHTML.indexOf(text);
    console.log(index);
    if (index >= 0) {
        console.log(innerHTML.substring(index - 25, index + text.length + 25))
        innerHTML = innerHTML.substring(0, index) + `<mark style='background-color: ${color}'>` + innerHTML.substring(index, index + text.length) + '</mark>' + innerHTML.substring(index + text.length);
        wikiText.innerHTML = innerHTML;
    }
}

renderGraphOverlay();
highlightPersistentContent("Ukraine",  "#99FF84");
const persistent = [
    "ranked #1 in Undergraduate Teaching by U.S. News & World Report for over a decade",
    "Founded in 1866",
    "Admissions is highly selective",
    "Carleton is one of the highest sources of undergraduate students pursuing doctorates",
    "private",
    "liberal arts college",
    "Northfield",
    "Extracurricular organizations",
    "Arboretum",
    "Cowling Arboretum"
];
var arrayLength = persistent.length;
for (var i = 0; i < arrayLength; i++) {
    highlightPersistentContent(persistent[i], "#99FF84");
}

/* The page id can be found as the last part of the link to
 * the wikidata item on the left side of wikipedia pages.
 * If no page id is found throws an error.
 */
const pageId = (() => {
    let wiki_data_url;
    try {
        wiki_data_url = document.getElementById('t-wikibase').getElementsByTagName('a')[0].href;
    } catch {
        throw new Error("'Can't find page id!");
    }
    const wiki_page_id = wiki_data_url.split('/').slice(-1)[0];
    console.info({
        "wiki_data_url": wiki_data_url,
        "wiki_page_id": wiki_page_id
    });
    return(wiki_page_id);
})();

const fetchChangeWithHTML = async (startID, endID) => {
    const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=compare&format=json&fromrev=${startID}&torev=${endID}&prop=diff%7Cids%7Ctitle%7Ctimestamp&formatversion=2`
    );
    const data = await response.json();
    const parser = new DOMParser()
    const document = parser.parseFromString(data['compare']['body'], 'text/html')
    const x = document.querySelectorAll("ins.diffchange.diffchange-inline");
    const result = [...x].map(node => node.innerText);
    return data['compare']['body']
}
console.log(fetchChangeWithHTML(1120213443, 1114427258))
console.log("1 con vit xoe ra 2 cai canh")