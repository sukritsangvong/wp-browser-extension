/* Creates the div for the graph overlay. TODO: create the graph */
function renderGraphOverlay() {
    let graphContainer = document.createElement('div');
    graphContainer.style.cssText = 'width:50%;height:150px;background-color:#E3C2FF;';

    let p = document.createElement('p');
    graphContainer.appendChild(p);
    let text = document.createTextNode('The graph overlay will be here');
    p.appendChild(text);

    let bodyContent = document.getElementById('bodyContent');
    bodyContent.insertBefore(graphContainer, bodyContent.firstChild);
}

/* Highlights the words that are given */
function highlightPersistentContent(text, color) {
    let wikiText = document.getElementById('mw-content-text');
    let innerHTML = wikiText.innerHTML;
    let index = innerHTML.indexOf(text);
    if (index >= 0) { 
        innerHTML = innerHTML.substring(0,index) + `<mark style='background-color: ${color}'>` + innerHTML.substring(index, index + text.length) + '</mark>' + innerHTML.substring(index + text.length);
        wikiText.innerHTML = innerHTML;
    }
}

// Highlight the entire (content) text of a Wikipedia page. Why? Testing
let wikiContent = document.getElementById('mw-content-text');
wikiContent.style.backgroundColor = '#CDE8FF';

renderGraphOverlay();

// Edge case: note how it didn't highlight the links
const persistent = ['ranked #1 in Undergraduate Teaching by U.S. News & World Report for over a decade', 'Founded in 1866', 
                    'Admissions is highly selective', 'Carleton is one of the highest sources of undergraduate students pursuing doctorates'];
var arrayLength = persistent.length;
for (var i = 0; i < arrayLength; i++) {
    highlightPersistentContent(persistent[i], '#99FF84');
}