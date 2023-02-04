/** 
 * Add a <mark id="mark-{index}">{char}</mark> tag around every character
 * @return {string} Returns a the concatenated text where each character index matches the mark id 
 */
const tagEveryChar = () => {
    const bodyContent = document.getElementById('mw-content-text').getElementsByClassName('mw-parser-output')[0];
    const treeWalker = document.createTreeWalker(
        bodyContent,
        NodeFilter.SHOW_TEXT,
        (node) => {
            if (node.parentElement.tagName === 'STYLE') {
                return NodeFilter.FILTER_REJECT;
            }
            if (node.nodeValue.trim()){
                return NodeFilter.FILTER_ACCEPT;
            } 
        }
    );

    let nodesToChange = [];
    while(treeWalker.nextNode()) {
        nodesToChange.push(treeWalker.currentNode);
    }

    return nodesToChange.reduce((accumulator, node) => {
        accumulator['text'] += node.textContent;

        const fragment = document.createDocumentFragment();
        for(let char of node.textContent) {
            let taggedNode = document.createElement('mark');
            taggedNode.id = `mark-${accumulator['index']++}`;
            taggedNode.innerText = char;
            fragment.appendChild(taggedNode);
        }
        node.parentNode.replaceChild(fragment, node)
        return accumulator;
    }, {"text":'', "index":0}).text;
}

const text = tagEveryChar();

export { text };