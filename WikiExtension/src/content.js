/* Creates the div for the graph overlay. TODO: create the graph and render it here */
function renderGraphOverlay() {
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
function highlightPersistentContent(text, color) {
    let index = innerHTML.indexOf(text);
    if (index >= 0) { 
        innerHTML = innerHTML.substring(0, index) + `<mark style='background-color: ${color}'>` + innerHTML.substring(index, index + text.length) + '</mark>' + innerHTML.substring(index + text.length);
        wikiText.innerHTML = innerHTML;
    }
}

renderGraphOverlay();